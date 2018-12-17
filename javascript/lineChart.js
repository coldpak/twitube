function LineChart(id = 'line_chart',
                   margin = { top: 40, right: 40, bottom: 40, left: 40 }) {

    const dom = document.getElementById(id)

    const _utils = Utils()
    const _width = dom.clientWidth - margin.left - margin.right
    const _height = dom.clientHeight - margin.top - margin.bottom
    const _chart = _utils.CreateSVG('line_chart', dom.clientWidth, dom.clientHeight, margin)
    _chart.append('g')
          .attr("fill", "none")
          .attr('id', 'lines')
    
          let xDomain = ['SUN', 'MON', 'TUE', 'WEN', 'THU', 'FRI', 'SAT']
    let _xScale = _utils.ScaleLinear([0, 1], [0, _width])
    let _yScale = _utils.ScaleLinear([1, 0], [0, _height])
    let _line = d3.line()
                  .x(function(d){ return _xScale(d['date']) + _xScale.bandwidth() / 2; })
                  .y(function(d){ return _yScale(d[_key]); })

    _utils.CreateAxis(_chart, _width, _height, 'xline', _xScale, 'yline', _yScale, 10, 10)

    let _key

    const _select = (select, key) => {
        select.transition()
            .duration(500)
            .attr('d', d => _line(d.value))
            .attr('class', d => 'line ' + d.key)
            .style('opacity', 1)
            .attr("stroke", 'black')
    }

    const _enter = (enter, key) => {
        enter.append('path')
            .style("mix-blend-mode", "multiply")
            .attr("stroke", 'black')
            .attr('class', d => 'line ' + d.key)
            .attr('d', d => _line(d.value))
            .style('opacity', 0)
            .transition()
            .duration(500)
            .delay(500)
            .style('opacity', 1)
    }

    const _exit = (exit) => exit.remove()

    return {
        Update: (dataset, user, key) => {
            data = {
                'key' : user,
                'value' : getLineChartData(dataset, user, key)
            }
            _key = key

            let maxValue = data.value.reduce((max, R) => max > R[key] ? max : R[key], 0)
            let minValue = data.value.reduce((min, R) => min < R[key] ? min : R[key], maxValue)

            let yDomain = [0.9 * minValue, 1.1 * maxValue]

            _xScale = _utils.ScaleBand(xDomain, [0, _width])
            _yScale = _utils.ScaleLinear(yDomain, [_height, 0])
            _utils.UpdateAxis(_chart, _xScale, _yScale, 500, 1, 10)

            let target = _chart.select('#lines')
                               .selectAll('.line')
                               .data([data], d => d.key)
            _exit(target.exit())
            _select(target, key)
            _enter(target.enter(), key)
        }
    }
}