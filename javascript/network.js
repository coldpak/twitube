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
    selected_index = 0,
    youtube_beta = 1.0,
    twitch_beta = 0.5;

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
var youtubeTable = Table('youtube_table');
var twitchTable = Table('twitch_table');
var pieChart = PieChart();
var integratedChart = IntegratedChart();
var tooltip = Tooltip();

/* 
var rankMap = {
    // youtube
    'pra' : {},
    'subscriber' : {},
    'view' : {},
    'youtube_potential' : {},
    // twitch
    'sra' : {},
    'follower' : {},
    'viewer' : {},
    'twitch_potential' : {},
    // merge
    'score' : {},
}
*/

var youtube_target_rank = ['pra_score', 'subscriber_count', 'recent_average_view']
var twitch_target_rank = ['sra_score', 'followers', 'average_viewer']
var youtubeRankMap = {}
var twitchRankMap = {}
var scoreRankMap = {}

var allYoutubeRankMap = {}
var allTwitchRankMap = {}
var allScoreRankMap = {}
var all_youtube_max_potential = -1.0
var all_twitch_max_potential = -1.0

var linkScoreMap = {
    'StoT': {},
    'TtoS' : {}
}
var scoreMap = []
var youtube_max_potential = 0.0
var twitch_max_potential = 0.0

var cur_user = ''

Promise.all(promises).then(function(values) {
    youtubeGraph = values[0];
    twitchGraph = values[1];
    init();
});

var influenceScale = ['normalized_view', 'normalized_follower', 'normalized_score'];
var colorMap = {}
var mostPlayedGameMap = {}

function makeMergedNodes(_youtubeNodes, _twitchNodes, alpha) {
    var nodeMappingTable = {};
    var nodes = [];

    _twitchNodes.forEach((node, i) => {
        let _id = node.id;

        let most_played_game = getMostPlayedGame(node['games'])
        let game = most_played_game['game']
        if ((checkedGames[game] != undefined && checkedGames[game] == false)
         || (checkedGames[game] == undefined && gameCheckedList[8] == false)) return;

        nodes.push({
            'id' : _id,
            'alias' : node.alias,
            'normalized_view' : (1 - alpha) * node['average_viewer']['normalized_viewer'],
            'normalized_follower' : (1 - alpha) * node['normalized_followers'],
            'normalized_score' : (1 - alpha) * twitch_beta * node['normalized_sra_score'],
            'games' : node['games'],
            'twitch_potential_score' : node['average_viewer']['normalized_viewer'] / node['normalized_followers'],
            'most_played_game' : most_played_game,
            'average_viewer' : node['average_viewer'],
            'followers' : node['followers'],
            'sra_score' : node['sra_score']
        });

        mostPlayedGameMap[_id] = most_played_game
        if (!nodeMappingTable[_id]) nodeMappingTable[_id] = nodes.length - 1;
    });

    _youtubeNodes.forEach((node, i) => {
        let index = nodeMappingTable[node.id];
        let target_node = nodes[index];
 
        if (!target_node) return;

        target_node['normalized_view'] += alpha * node['normalized_average_view'];
        target_node['normalized_follower'] += alpha * node['normalized_subscriber_count'];
        target_node['youtube_potential_score'] = node['normalized_subscriber_count'] > 0 ? node['normalized_average_view'] / node['normalized_subscriber_count'] : 0.0;
        target_node['normalized_score'] += alpha * youtube_beta * node['normalized_pra_score'];
        target_node['subscriber_count'] =  node['subscriber_count'];
        target_node['recent_average_view'] = node['recent_average_view'];
        target_node['pra_score'] = node['pra_score'];
    
        scoreMap.push({
            'id' : node.id,
            'score' : target_node['normalized_score'],
            'youtube_potential_score' : target_node['youtube_potential_score'],
            'twitch_potential_score' : target_node['twitch_potential_score'],
        });


        twitch_max_potential = Math.max(twitch_max_potential, target_node['twitch_potential_score'])
        youtube_max_potential = Math.max(youtube_max_potential, target_node['youtube_potential_score'])

        if (all_twitch_max_potential < 0) {
            all_youtube_max_potential = youtube_max_potential;
            all_twitch_max_potential = twitch_max_potential;
        }
    });

    return nodes;
}

function makeMergedLinks(_youtubeLinks, _twitchLinks, alpha, dropout) {
    var linkMappingTable = {};
    var links = [];

    _youtubeLinks.forEach((link, i) => {
        let source = link.source, target = link.target;   
        if (!mostPlayedGameMap[source] || !mostPlayedGameMap[target]) return;

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
        if (!mostPlayedGameMap[source] || !mostPlayedGameMap[target]) return;

        let _id = source + target;
        let index = linkMappingTable[_id];
        let target_link =  links[index];

        if (!linkScoreMap.StoT[source]) linkScoreMap.StoT[source] = {}
        if (!linkScoreMap.TtoS[target]) linkScoreMap.TtoS[target] = {}

        if (target_link){
            target_link['normalized_score'] += (1 - alpha) * link['normalized_score'];
            if (target_link['normalized_score'] < dropout) target_link['normalized_score'] = 0;
            linkScoreMap.StoT[source][target] = linkScoreMap.TtoS[target][source] = target_link['normalized_score']
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
            linkScoreMap.StoT[source][target] = linkScoreMap.TtoS[target][source] = score
        }


        
    });
    return links.filter(d => d.normalized_score >= dropout);
}

function merge(alpha=0.5, dropout=0.1) {
    /* initialize global variables */
    youtubeRankMap = {}
    twitchRankMap = {}
    scoreRankMap = {}
    linkScoreMap = {
        'StoT': {},
        'TtoS' : {}
    }
    scoreMap = []
    twitch_max_potential = 0.0
    youtube_max_potential = 0.0
    
    mostPlayedGameMap = {}
    checkedGames = {}

    /* Merge */
    gameCheckedList.forEach((d, i) => {
        checkedGames[gameKeyMap[i]] = d && i > 0 && i < 9 ? true : false;
    })
    var _nodes = makeMergedNodes(youtubeGraph.nodes, twitchGraph.nodes, alpha);
    var _links = makeMergedLinks(youtubeGraph.links, twitchGraph.links, alpha, dropout);

    /* Create Rank Map */
    youtubeRankMap = getRankMap(_nodes, youtube_target_rank);
    twitchRankMap = getRankMap(_nodes, twitch_target_rank);
    scoreRankMap = {
        'mra_score' : getRank(scoreMap, 'score'),
        'youtube_potential' : getRank(scoreMap, 'youtube_potential_score'),
        'twitch_potential' : getRank(scoreMap, 'twitch_potential_score'),
    }

    if (Object.keys(allScoreRankMap).length == 0) {
        allScoreRankMap = scoreRankMap
        allYoutubeRankMap = youtubeRankMap
        allTwitchRankMap = twitchRankMap
    }

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
    Legend('legend_container', gameColorMap)
    InitIntroduction('intro')

    var alphaTargets = ['alpha_label', 'alpha_output'],
        betaTargets = ['youtube_beta_label', 'youtube_beta_output', 'twitch_beta_label', 'twitch_beta_output'],
        dropoutTargets = ['dropout_label', 'dropout_output'];
    AddTooltipEvent(tooltip, alphaTargets, tooltipMessages['alpha'])
    AddTooltipEvent(tooltip, betaTargets, tooltipMessages['beta'])
    AddTooltipEvent(tooltip, dropoutTargets, tooltipMessages['dropout'])
    AddTooltipEvent(tooltip, ['view_span'], tooltipMessages['view'])
    AddTooltipEvent(tooltip, ['follower_span'], tooltipMessages['follower'])
    AddTooltipEvent(tooltip, ['score_span'], tooltipMessages['score'])
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
                if (d["most_played_game"]) {
                    let color = gameColorMap[d["most_played_game"]["game"]];
                    return color ? color : gameColorMap["Others"]
                }
                else {
                    return d3.rgb(0, 0, 0);
                }
            })
            .on("mousedown", mouseDown(0))
            .on("click", (d) => mouseClick(d))
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
                .attr("dx", ".5em")
                .attr("dy", ".5em")
                .attr("font-family", "Verdana")
                .attr("font-size", 12)
                .attr("font-weight", 'bold')
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
        document.querySelector('.score_info .mra_score').innerHTML = `MRA score : ${scoreRankMap['mra_score'][cur_user]['score'].toFixed(2)} \
        (${( 100 * scoreRankMap['mra_score'][cur_user]['rank'] / Object.keys(scoreRankMap['mra_score']).length).toFixed(2)} %)`;
        showSummary(cur_user);
        return;
    }
    if (id === 'dropout_value') {
        dropout_rate = value;
        document.querySelector('#dropout_output').value = value;
        restart(alpha_rate, dropout_rate, selected_index);
        document.querySelector('.score_info .mra_score').innerHTML = `MRA score : ${scoreRankMap['mra_score'][cur_user]['score'].toFixed(2)} \
        (${( 100 * scoreRankMap['mra_score'][cur_user]['rank'] / Object.keys(scoreRankMap['mra_score']).length).toFixed(2)} %)`;
        showSummary(cur_user);
        return;
    }
    if (id === 'search_bar') {
        searchNodeByAlias(value);
        document.querySelector('#search_bar').value = '';
        document.querySelector('.score_info .mra_score').innerHTML = `MRA score : ${scoreRankMap['mra_score'][cur_user]['score'].toFixed(2)} \
        (${( 100 * scoreRankMap['mra_score'][cur_user]['rank'] / Object.keys(scoreRankMap['mra_score']).length).toFixed(2)} %)`;
        showSummary(cur_user);
        return;
    }
    if (id === 'youtube_beta') {
        youtube_beta = value;
        document.querySelector('#youtube_beta_output').value = value;
        restart(alpha_rate, dropout_rate, selected_index);
        document.querySelector('.score_info .mra_score').innerHTML = `MRA score : ${scoreRankMap['mra_score'][cur_user]['score'].toFixed(2)} \
        (${( 100 * scoreRankMap['mra_score'][cur_user]['rank'] / Object.keys(scoreRankMap['mra_score']).length).toFixed(2)} %)`;
        showSummary(cur_user);
        return;
    }
    if (id === 'twitch_beta') {
        twitch_beta = value;
        document.querySelector('#twitch_beta_output').value = value;
        restart(alpha_rate, dropout_rate, selected_index);
        document.querySelector('.score_info .mra_score').innerHTML = `MRA score : ${scoreRankMap['mra_score'][cur_user]['score'].toFixed(2)} \
        (${( 100 * scoreRankMap['mra_score'][cur_user]['rank'] / Object.keys(scoreRankMap['mra_score']).length).toFixed(2)} %)`;
        showSummary(cur_user);
        return;
    }
    
    return null;
}

function mouseClick(node) {
    cur_user = node.id
    pieChart.Update(twitchGraph.nodes, node.id)
    integratedChart.Update(twitchGraph.statistics["weekly_summary"], node.id);
    youtubeTable.Update(youtubeGraph.nodes, node.id, 'youtube');
    twitchTable.Update(twitchGraph.nodes, node.id, 'twitch');
    document.querySelector('.score_info .mra_score').innerHTML = `MRA score : ${scoreRankMap['mra_score'][node.id]['score'].toFixed(2)} \
                                                              (${( 100 * scoreRankMap['mra_score'][node.id]['rank'] / Object.keys(scoreRankMap['mra_score']).length).toFixed(2)} %)`;
    document.querySelector('.common_info .name').innerHTML = 'Name: ' + node.alias;
    showSummary(node.id);
}

function clickRadiusCheckbox(index) {
    radiusCheckedList = radiusCheckedList.map((d, i) => ( i == index ));
    document.getElementsByClassName('checkbox_radius')[0].checked = radiusCheckedList[0];
    document.getElementsByClassName('checkbox_radius')[1].checked = radiusCheckedList[1];
    document.getElementsByClassName('checkbox_radius')[2].checked = radiusCheckedList[2];
    selected_index = index;
    restart(alpha_rate, dropout_rate, index);
    searchNodeById(cur_user);
    showSummary(cur_user);
}

function clickAllGameCheckbox() {
    var checkBoxes = document.getElementsByClassName('checkbox_games');
    var setting = checkBoxes[0].checked
    for (var i = 1 ; i < gameCheckedList.length ; i++) {
        gameCheckedList[i] = checkBoxes[i].checked = setting;
    }
    restart(alpha_rate, dropout_rate, selected_index);
    searchNodeById(cur_user);
    showSummary(cur_user);
}
function clickGameCheckbox(index) {
    var checkBoxes = document.getElementsByClassName('checkbox_games');
    if (checkBoxes[0].checked) checkBoxes[0].checked = false; 
    gameCheckedList[index] = checkBoxes[index].checked;
    restart(alpha_rate, dropout_rate, selected_index);
    searchNodeById(cur_user);
    showSummary(cur_user);
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

function searchNodeById(str) {
    label.style("opacity", function (o) {
        thisOpacity = o.id === str ? 1 : 0.2;
        return thisOpacity;
    });
    node.style("stroke-opacity", function (o) {
        thisOpacity = o.id === str ? 1 : 0.2;
        return thisOpacity;
    });
    node.style("fill-opacity", function (o) {
        thisOpacity = o.id === str ? 1 : 0.2;
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