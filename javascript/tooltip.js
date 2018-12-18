function Tooltip(parent = 'body', classname = 'tooltip') {
    // Define a div for a tooltip
    return d3.select(parent)
             .append('div')
             .attr('class', classname)
             .style('opacity', 0)
}