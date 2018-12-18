function PieChart(id = 'pie_chart') {
    const translate = (x, y) => 'translate(' + x + ', ' + y + ')';
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    /* Create chart */
    const dom = document.getElementById(id)
    const width = dom.clientWidth;
    const height = dom.clientHeight;
    const radius = Math.min(width, height) / 2.5;

    const chart = d3.select("#" + id)
                    .append("svg")
                        .attr("width", width)
                        .attr("height", height)
                    .append("g")
                        .attr("transform" , translate(width / 2, height / 2));

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie()
                  .value(d => d["duration"])
                  .sort(null);

    const arc = d3.arc()
                  .innerRadius(0)
                  .outerRadius(radius);

    function arcTween(a) {
        const i = d3.interpolate(this._current, a);
        this._current = i(1);
        return (t) => arc(i(t));
    }

    const labelArc = d3.arc()
                       .outerRadius(radius - 20)
                       .innerRadius(radius - 20);

    return {
        Update : (dataset, user) => {
            let data = getPieChartData(dataset, user)
            chart.selectAll("path").remove()
            chart.selectAll("text").remove()

            const path = chart.selectAll("path")
                              .data(pie(data), d => d.data["game"]);
            const text = chart.selectAll("text")
                              .remove()

            path.exit()
                .remove()
                
            path.transition()
                .duration(200)
                .attrTween("d", arcTween);

            path.enter()
                .append("path")
                .attr("fill", (d, i) => {
                    let game = d.data["game"]
                    if (game) {
                        let color = gameColorMap[game];
                        return color ? color : gameColorMap["Others"]
                    }
                    else {
                        return d3.rgb(0, 0, 0);
                    }
                })
                .attr("d", arc)
                .attr("stroke", "black")
                .attr("stroke-width", "2px")
                .on('mouseover', function(d) {
                    let ratio = (d.endAngle - d.startAngle) / (2 * Math.PI) * 100
                    tooltip.transition()
                       .duration(300)
                       .style('opacity', 0.9)
                    tooltip.html(`Game : ${d.data['game']} </br>
                              Duration : ${d.data['duration']} h</br>
                              Ratio : ${ratio.toFixed(1)} %</br>`)	
                       .style("left", (d3.event.pageX) + "px")		
                       .style("top", (d3.event.pageY - 28) + "px");	
                })
                .on('mouseout', function(d) {
                    tooltip.transition()
                       .duration(300)
                       .style('opacity',  0)
                })
                .each(function(d) { this._current = d; })
                .style('opacity', 0)
                .transition()
                .duration(500)
                .delay(500)
                .style('opacity', 1)
            
            path.enter()
                .append("text")
                .attr("transform", function(d) {
                    return "translate(" + labelArc.centroid(d) + ")";
                })
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .attr("display", function(d) {
                    if (d.endAngle - d.startAngle < 0.4 ) {
                        return "none"
                    }
                    else {
                        return 'block'
                    }
                })
                .attr("font-size", "11px")
                .text(function (d) {
                    return d.data["game"];
                })
                .style('opacity', 0)
                .transition()
                .duration(500)
                .delay(500)
                .style('opacity', 1)

                
            path.append("text")
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("display", function(d) {
                    if (d.endAngle - d.startAngle < 0.5 ) {
                        return "none"
                    }
                    else {
                        return 'block'
                    }
                })
                .attr("font-size", "9px")
                .text(function (d) {
                    return d.data["game"];
                })
                .style('opacity', 0)
                .transition()
                .duration(500)
                .delay(500)
                .style('opacity', 1)

        }
    };

}

