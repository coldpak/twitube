var svg = d3.select('svg'),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) {
        return d.id;
    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

defs = svg.append("defs");

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
    'data/youtube-181214.json',
    'data/twitch-181214.json'
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

var youtubeGraph, twitchGraph;

Promise.all(promises).then(function(values) {
    youtubeGraph = values[0];
    twitchGraph = values[1];
    init();

    // pie chart test
    var pieChart = PieChart();
    pieChart_data = twitchGraph.nodes.filter((d) => d.id == "얍얍")[0]["games"]
    pieChart.Update(pieChart_data)
});

var nodeMappingTable = {};
var linkMappingTable = {};

var influenceScale = ['normalized_view', 'normalize_follower', 'normalized_score'];

function makeMergedNodes(_youtubeNodes, _twitchNodes, alpha) {
    var nodes = [];
    _youtubeNodes.forEach((node, i) => {
        let _id = node.id;

        nodes.push({
            'id' : _id,
            'alias' : node.alias,
            'normalized_view' : alpha * node['normalized_average_view'],
            'normalized_follower' : alpha * node['normalized_subscriber_count'],
            'normalized_score' : alpha * node['normalized_pra_score']
        });

        if (!nodeMappingTable[_id]) nodeMappingTable[_id] = i;
    });

    _twitchNodes.forEach((node, i) => {
        let index = nodeMappingTable[node.id];
        let target_node = nodes[index];
        
        target_node['normalized_view'] += (1 - alpha) * node['average_viewer']['normalized_viewer'];
        target_node['normalized_follower'] += (1 - alpha) * node['normalized_followers'];
        target_node['normalized_score'] += (1 - alpha) * node['normalized_sra_score'];
    });
    return nodes;
}

function makeMergedLinks(_youtubeLinks, _twitchLinks, alpha) {
    var links = [];
    _youtubeLinks.forEach((link, i) => {
        let source = link.source, target = link.target;
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
        let _id = source + target;
        let index = linkMappingTable[_id];
        let target_link =  links[index];

        if (target_link){
            target_link['normalized_score'] += (1 - alpha) * link['normalized_score'];
        }
        else {
            links.push({
                'source': source,
                'target': target,
                'normalized_score': (1 - alpha) * link['normalized_score']
            });
        }
    });
    
    return links;
}

function merge(alpha=0.5) {
    var _nodes = makeMergedNodes(youtubeGraph.nodes, twitchGraph.nodes, alpha);
    var _links = makeMergedLinks(youtubeGraph.links, twitchGraph.links, alpha);

    return { 
        'nodes': _nodes,
        'links': _links
    };
}

function init() {
    /*
    var kinds = ["averageView", "subscriberCount", "recent_average_view"]
    var kind_max = {}
    for (var i = 0; i < kinds.length; i++) {
        kind_max[kinds[i]] = d3.max(graph.nodes, function (d) {
            return d[kinds[i]];
        });
    };
    var kind_to_color = function (d) {
        return d3.rgb(
            225 * d.averageView / kind_max.averageView,
            225 * d.recent_average_view / kind_max.recent_average_view,
            200
        )
    };
    */

    var graph = merge();
    // 

    // Create graph
    var main = svg.append("g")
        .attr("class", "graph");

    // Make force simulation
    var simulation = d3.forceSimulation()
        .nodes(graph.nodes);

    simulation
        .force("charge_force", d3.forceManyBody().strength(-70))
        .force("center_force", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(function (d) {
            return 20 * d.normalized_average_view + 0.5;
        }).iterations(2))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    // Create circles
    var node = main.selectAll(".node_circle")
        .data(graph.nodes)
            .enter().append("circle")
                .attr("class", ".node_circle")
                .attr("r", function (node) {
                    return 20 * node[influenceScale[0]];
                })
                // .attr("fill", function (d) {
                //     return kind_to_color(d).toString();
                // })
                .on("mousedown", mouseOver(0))
                .call(drag(simulation));
    document.body.addEventListener("mouseup", mouseOut);

    //add tick instructions: 
    simulation.on("tick", tickActions);

    //Create the link force 
    //We need the id accessor to use named sources and targets 

    var link_force = d3.forceLink(graph.links)
        .id(function (d) {
            return d.id;
        })
        .distance(40);

    simulation.force("links", link_force);

    //draw lines for the links 
    var link = main.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .attr("class", "link")
        .attr("marker-end", "url(#arrow)")
        .attr("stroke-width", function (d) {
            return 5 * Math.sqrt(d.normalized_score)
        });
    // label nodes with alias
    var label = main.selectAll(".node_label")
        .data(graph.nodes)
        .enter().append("text")
        .attr("class", "node_label")
        .attr("dx", ".4em")
        .attr("dy", ".4em")
        .attr("font-family", "Verdana")
        .attr("font-size", 10)
        .style("fill", "#000000")
        .text(function (d) {
            return d.alias;
        });

    function tickActions() {
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
    // build a dictionary of nodes that are linked
    var linkedByIndex = {};
    graph.links.forEach(function (d) {
        if (d.normalized_score < 0.1) linkedByIndex[d.source.index + "," + d.target.index] = false; // TODO: dropout rate
        else linkedByIndex[d.source.index + "," + d.target.index] = true;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

    function outlinkExist(a, b) {
        return linkedByIndex[a.index + "," + b.index];
    }

    function mouseOver(opacity) {
        return function (d) {
            // check all other nodes to see if they're connected
            // to this one. if so, keep the opacity at 1, otherwise
            // fade
            node.style("stroke-opacity", function (o) {
                thisOpacity = isConnected(d, o) ? 1 : opacity;
                return thisOpacity;
            });
            node.style("fill-opacity", function (o) {
                thisOpacity = isConnected(d, o) ? 1 : 0.2;
                return thisOpacity;
            });
            // also style link accordingly
            link.style("stroke-opacity", function (o) {
                if (o.normalized_score < 0.1) return opacity;
                return o.source === d || o.target === d ? .5 : opacity;
            });
            link.style("stroke", function (o) {
                if (o.normalized_score < 0.1) {
                    return "#ddd";
                }
                // out-link
                if (o.source === d) {
                    return outlinkExist(o.target, d) ? "#922" : "#292";
                }
                // in-link
                if (o.target === d) {
                    return outlinkExist(d, o.source) ? "#922" : "#229";
                }
                return "#ddd";
            });
            link.style("fill", function (o) {
                if (o.normalized_score < 0.1) {
                    return "#ddd";
                }
                // out-link
                if (o.source === d) {
                    return outlinkExist(o.target, d) ? "#922" : "#292";
                }
                // in-link
                if (o.target === d) {
                    return outlinkExist(d, o.source) ? "#922" : "#229";
                }
                return "#ddd";
            });
            link.attr('marker-end', function (o) {
                if (o.normalized_score < 0.1) {
                    return null;
                }
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

    function mouseOut() {
        node.style("stroke-opacity", 1);
        node.style("fill-opacity", 1);
        link.style("stroke-opacity", .2);
        link.style("stroke", "#ddd");
        link.attr('marker-end', 'url(#arrow)');
    }
}

drag = function (simulation) {

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