function Legend(id, colorMap) {
    var dom = document.getElementById(id)
    var svg = d3.select("#" + id)
                      .append("svg")
                      .attr("width", dom.clientWidth)
                      .attr("height", dom.clientHeight)
    
    var data = Array.from(Object.keys(colorMap), (key) => {
        return {
            'key' : key,
            'value' : colorMap[key]
        }
    })

    var legend = svg.selectAll('.legend')
                    .data(data)
                    .enter().append('g')
                    .attr("class", "legend")
                    .attr("transform", function (d, i) {
                        return "translate(10," + i * 20 + ")"
                    })

    legend.append('rect')
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", function (d) {
                return d.value
            })

    legend.append('text')
          .attr("x", 20)
          .attr("y", 10)
          .text(function (d) {
                return d.key
           })
          .attr("class", "textselected")
}