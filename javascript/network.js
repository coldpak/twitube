var width = 960,
    height = 580;

var svg = d3.select('#graph_view')
            .append('svg')
                .attr("width", width)
                .attr("height", height);

var main = svg.append("g").attr("id", "graph"),
    node = main.append("g").selectAll(".node_circle"),
    link = main.append("g").selectAll(".link"),
    label = main.append("g").selectAll(".node_label");

var radius = 35,
    distance = 40,
    stroke = 15;

var linkedByIndex = {};
var radiusCheckedList = Array.apply(null, Array(3)).map(function (d, i) { return i != 0 ? false : true ;}),
    gameCheckedList = Array.apply(null, Array(9)).map(function (d, i) { return true ;});
var checkedGames = [];

var alpha_rate = 0.5,
    dropout_rate = 0.1,
    selected_index = 0;

var defs = svg.append("defs");

function arrowFactory(defs, arrow_id) {
    defs.append("marker")
        .attr("id", arrow_id)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 5)
        .attr("refY", 0)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class", "arrowHead");
}

arrowFactory(defs, "arrow");
arrowFactory(defs, "inArrow");
arrowFactory(defs, "outArrow");
arrowFactory(defs, "bothArrow");

var paths = [
    'data/youtube-181216.json',
    'data/twitch-181216.json'
];

var promises = [];

paths.forEach(function(url) {
    promises.push(
        new Promise(function(resolve, reject) {
            d3.json(url)
                .then(function(res) {
                    resolve(res);
                })
                .catch(function(err) {
                    console.error(err);
                    reject(err);
                });
        })
    );
});
var youtubeGraph, twitchGraph, graph, simulation;

var chartContainer = document.getElementsByClassName("chart")[0];
var pieChart = PieChart();
var lineChart = LineChart();
var lineChart_key = 'viewer';

Promise.all(promises).then(function(values) {
    youtubeGraph = values[0];
    twitchGraph = values[1];
    init();
});

var influenceScale = ['normalized_view', 'normalized_follower', 'normalized_score'];
var colorMap = {}
var favoriteGameMap = {}

function makeMergedNodes(_youtubeNodes, _twitchNodes, alpha) {
    var nodeMappingTable = {};
    var nodes = [];

    _twitchNodes.forEach((node, i) => {
        let _id = node.id;

        let favorite_game = node['games'].reduce((most, R) => {
                return R.duration > most.duration ? R : most
            }, { 'game' : '', 'duration' : 0.0 })
        let game = favorite_game['game']
        if ((checkedGames[game] != undefined && checkedGames[game] == false)
         || (checkedGames[game] == undefined && gameCheckedList[8] == false)) return;

        nodes.push({
            'id' : _id,
            'alias' : node.alias,
            'normalized_view' : (1 - alpha) * node['average_viewer']['normalized_viewer'],
            'normalized_follower' : (1 - alpha) * node['normalized_followers'],
            'normalized_score' : 0.75 * (1 - alpha) * node['normalized_sra_score'],
            'games' : node['games'],
            'favorite_game' : favorite_game
        });

        favoriteGameMap[_id] = favorite_game
        if (!nodeMappingTable[_id]) nodeMappingTable[_id] = nodes.length - 1;
    });

    _youtubeNodes.forEach((node, i) => {
        let index = nodeMappingTable[node.id];
        let target_node = nodes[index];
 
        if (!target_node) return;

        target_node['normalized_view'] += alpha * node['normalized_average_view'];
        target_node['normalized_follower'] += alpha * node['normalized_subscriber_count'];
        let potential_score = node['normalized_average_view'] / node['normalized_subscriber_count'];
        target_node['normalized_score'] += 1.5 * potential_score * alpha * node['normalized_pra_score'];
    });

    return nodes;
}

function makeMergedLinks(_youtubeLinks, _twitchLinks, alpha, dropout) {
    var linkMappingTable = {};
    var links = [];

    _youtubeLinks.forEach((link, i) => {
        let source = link.source, target = link.target;   
        if (!favoriteGameMap[source] || !favoriteGameMap[target]) return;

        let _id = source + target;
        links.push({
            'source': source,
            'target': target,
            'normalized_score': alpha * link['normalized_score']
        });

        if (!linkMappingTable[_id]) linkMappingTable[_id] = i;
    });

    _twitchLinks.forEach((link, i) => {
        let source = link.source, target = link.target;
        if (!favoriteGameMap[source] || !favoriteGameMap[target]) return;

        let _id = source + target;
        let index = linkMappingTable[_id];
        let target_link =  links[index];

        if (target_link){
            target_link['normalized_score'] += (1 - alpha) * link['normalized_score'];
            if (target_link['normalized_score'] < dropout) target_link['normalized_score'] = 0;
        }
        else {
            let score = (1 - alpha) * link['normalized_score']
            if (score < dropout) {
                score = 0
            }
            links.push({
                'source': source,
                'target': target,
                'normalized_score': score
            });
        }
    });
    return links.filter(d => d.normalized_score >= dropout);
}

function merge(alpha=0.5, dropout=0.1) {
    favoriteGameMap = {}
    checkedGames = {}
    gameCheckedList.forEach((d, i) => {
        checkedGames[gameKeyMap[i]] = d && i > 0 && i < 9 ? true : false;
    })
    var _nodes = makeMergedNodes(youtubeGraph.nodes, twitchGraph.nodes, alpha);
    var _links = makeMergedLinks(youtubeGraph.links, twitchGraph.links, alpha, dropout);

    return { 
        'nodes': _nodes,
        'links': _links
    };
}

function makeForceSimulation(nodes) {
    var simulation = d3.forceSimulation()
    .nodes(nodes);

    simulation
        .force("charge_force", d3.forceManyBody().strength(-100))
        .force("center_force", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    return simulation;
}

function tickActions(node, link, label) {
    //update circle positions each tick of the simulation 
    node
        .attr("cx", function (d) {
            return d.x = Math.max(2, Math.min(width - 2, d.x));
        })
        .attr("cy", function (d) {
            return d.y = Math.max(2, Math.min(height - 2, d.y));
        });

    //update link positions 
    //simply tells one end of the line to follow one node around
    //and the other end of the line to follow the other node around
    link
        .attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });
    label
        .attr("x", function (d) {
            return d.x;
        })
        .attr("y", function (d) {
            return d.y;
        });
}

function createLinkForce(links) {
    //Create the link force 
    //We need the id accessor to use named sources and targets 
    return d3.forceLink(links)
        .id(function (d) {
            return d.id;
        })
        .distance(distance);
}

function init() {
    // Create graph
    graph = merge(alpha_rate, dropout_rate);
    // Add mouseup event to graph_view
    document.getElementById('graph_view').addEventListener("mouseup", mouseUp);

    // Make force simulation
    simulation = makeForceSimulation(graph.nodes);
    // Add tick instructions: 
    simulation.on("tick", () => tickActions(node, link, label));
    
    restart(); 
}
function mouseUp() {
    label.style("opacity", 1);
    node.style("stroke-opacity", 1);
    node.style("fill-opacity", 1);
    link.style("stroke-opacity", .2);
    link.style("stroke", "#ddd");
    link.attr('marker-end', 'url(#arrow)');
}

function restart(alpha=0.5, dropout=0.1, scale_index=0) {
    graph = merge(alpha, dropout);
    // Create circles, General update pattern
    node = node.data(graph.nodes, d => d.id);

    node.exit().transition()
        .attr("r", 0).remove();
    node.transition()
        .duration(1000)
        .attr("r", function (node) {
            return radius * node[influenceScale[scale_index]];
        });
    node = node.enter().append("circle")
            .attr("class", ".node_circle")
            .attr("id", d=>d.alias)
            .style("stroke", "black")
            .attr("r", function (node) {
                return radius * node[influenceScale[scale_index]];
            })
            .attr("fill", function (d) {
                if (d["favorite_game"]) {
                    let color = gameColorMap[d["favorite_game"]["game"]];
                    return color ? color : gameColorMap["Others"]
                }
                else {
                    return d3.rgb(0, 0, 0);
                }
            })
            .on("mousedown", mouseDown(0))
            .on("click", (d) => mouseClick(d.id))
            .call(drag(simulation))
            .merge(node);
    
    //draw lines for the links 
    link = link.data(graph.links, d => d.source + "-" + d.target);
    link.exit().transition()
        .attr("stroke-width", 0).remove();
    link.transition()
        .duration(1000)
        .attr("stroke-width", function(d) {
            return stroke * d.normalized_score;
        });
    link = link.enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", function (d) {
            return stroke * d.normalized_score;
        })
        .merge(link);
    // label nodes with alias
    label = label.data(graph.nodes, d => d.id)
    label.exit().remove();

    label = label.enter().append("text")
                .attr("class", "node_label")
                .attr("dx", ".4em")
                .attr("dy", ".4em")
                .attr("font-family", "Verdana")
                .attr("font-size", 10)
                .style("fill", "#000000")
                .text(function (d) {
                    return d.alias;
                })
                .merge(label);
    simulation.nodes(graph.nodes);
    // Create Link Forces
    simulation.force("links", createLinkForce(graph.links));
    simulation.alpha(1).restart();
    // build a dictionary of nodes that are linked
    linkedByIndex = {};
    graph.links.forEach(function (d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });
    
    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

    function outlinkExist(a, b) {
        return linkedByIndex[a.index + "," + b.index];
    }

    function mouseDown(opacity) {
        return function (d) {
            // check all other nodes to see if they're connected
            // to this one. if so, keep the opacity at 1, otherwise
            // fade
            label.style("opacity", function (o) {
                thisOpacity = isConnected(d, o) ? 1 : 0.2;
                return thisOpacity;
            });
            node.style("stroke-opacity", function (o) {
                thisOpacity = isConnected(d, o) ? 1 : 0.2;
                return thisOpacity;
            });
            node.style("fill-opacity", function (o) {
                thisOpacity = isConnected(d, o) ? 1 : 0.2;
                return thisOpacity;
            });
            // also style link accordingly
            link.style("stroke-opacity", function (o) {
                return o.source === d || o.target === d ? .5 : opacity;
            });
            link.style("stroke", function (o) {
                // out-link
                if (o.source === d) {
                    return outlinkExist(o.target, d) ? "#922" : "#292";
                }
                // in-link
                if (o.target === d) {
                    return outlinkExist(d, o.source) ? "#922" : "#992";
                }
                return "#ddd";
            });
            link.style("fill", function (o) {
                // out-link
                if (o.source === d) {
                    return outlinkExist(o.target, d) ? "#922" : "#292";
                }
                // in-link
                if (o.target === d) {
                    return outlinkExist(d, o.source) ? "#922" : "#992";
                }
                return "#ddd";
            });
            link.attr('marker-end', function (o) {
                // out-link
                if (o.source === d) {
                    return outlinkExist(o.target, d) ? 'url(#bothArrow)' : 'url(#outArrow)';
                }
                // in-link
                if (o.target === d) {
                    return outlinkExist(d, o.source) ? 'url(#bothArrow)' : 'url(#inArrow)';
                }
                return 'url(#arrow)';
            });
        };
    }
}

function changeInputValue(value, id) {
    if (id === 'alpha_value') {
        alpha_rate = value;
        document.querySelector('#alpha_output').value = value;
        restart(alpha_rate, dropout_rate, selected_index);
        return;
    }
    if (id === 'dropout_value') {
        dropout_rate = value;
        document.querySelector('#dropout_output').value = value;
        restart(alpha_rate, dropout_rate, selected_index);
        return;
    }
    if (id === 'search_bar') {
        searchNodeByAlias(value);
        document.querySelector('#search_bar').value = '';
        return;
    }
    
    return null;
}

function mouseClick(user) {
    pieChart.Update(twitchGraph.nodes, user)
    lineChart.Update(twitchGraph.statistics["weekly_summary"], user, lineChart_key);
}

function clickRadiusCheckbox(index) {
    radiusCheckedList = radiusCheckedList.map((d, i) => ( i == index ));
    document.getElementsByClassName('checkbox_radius')[0].checked = radiusCheckedList[0];
    document.getElementsByClassName('checkbox_radius')[1].checked = radiusCheckedList[1];
    document.getElementsByClassName('checkbox_radius')[2].checked = radiusCheckedList[2];
    selected_index = index;
    restart(alpha_rate, dropout_rate, index);
}

function clickAllGameCheckbox() {
    var checkBoxes = document.getElementsByClassName('checkbox_games');
    var setting = checkBoxes[0].checked
    for (var i = 1 ; i < gameCheckedList.length ; i++) {
        gameCheckedList[i] = checkBoxes[i].checked = setting;
    }
    restart(alpha_rate, dropout_rate, selected_index);
}
function clickGameCheckbox(index) {
    var checkBoxes = document.getElementsByClassName('checkbox_games');
    if (checkBoxes[0].checked) checkBoxes[0].checked = false; 
    gameCheckedList[index] = checkBoxes[index].checked;
    restart(alpha_rate, dropout_rate, selected_index);
}

function searchNodeByAlias(str) {
    label.style("opacity", function (o) {
        thisOpacity = o.alias === str ? 1 : 0.2;
        return thisOpacity;
    });
    node.style("stroke-opacity", function (o) {
        thisOpacity = o.alias === str ? 1 : 0.2;
        return thisOpacity;
    });
    node.style("fill-opacity", function (o) {
        thisOpacity = o.alias === str ? 1 : 0.2;
        return thisOpacity;
    });
    link.style("stroke-opacity", 0.2)
        .style("stroke", "#ddd")
        .style("fill", "#ddd")
        .attr('marker-end', 'url(#arrow)');
    try {
        main.select(`#${str}`).dispatch('click');
    } catch(e) {
        return null;
    }
}

var drag = function (simulation) {

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}