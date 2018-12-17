const Utils = () => {
    const translate = (x, y) => 'translate(' + x + ', ' + y + ')'

    const createSVG = (container, w, h, margin) => {
        return d3.select('#' + container)
            .append('svg')
            .attr('width', w)
            .attr('height', h)
            .append('g')
            .attr('transform', translate(margin.left, margin.top))
    }

    let _xAxisID, _yAxisID
    let _xTicks, _yTicks
    const createAxis = (svg, width, height,
                        xid, xScale,
                        yid, yScale,
                        xTicks = 10, yTicks = 10) => {
        _xAxisID = xid
        _yAxisID = yid, yid
        _xTicks = xTicks
        _yTicks = yTicks

        svg.append('g')
        .attr('id', _xAxisID)
        .attr('transform', translate(0, height))
        .call(d3.axisBottom(xScale).ticks(_xTicks))
        svg.append('g')
        .attr('id', _yAxisID)
        .call(d3.axisLeft(yScale).ticks(_yTicks))
    }

    const updateAxis = (svg, xScale, yScale, duration = 0, xTicks = 1, yTicks = 10) => {
        svg.select('#' + _xAxisID)
            .transition()
            .duration(duration)
            //.call(d3.axisBottom(xScale).ticks(xTicks))
            .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d, i) => !(i % xTicks))))
        svg.select('#' + _yAxisID)
            .transition()
            .duration(duration)
            .call(d3.axisLeft(yScale).ticks(yTicks))
    }

    const scaleBand = (domain, range) => {
        return d3.scaleBand()
            .domain(domain)
            .rangeRound(range)
            .padding(0.1)
    }

    const scaleLinear = (domain, range) => {
        return d3.scaleLinear()
            .domain(domain)
            .range(range)
    }

    return {
        Translate: translate,
        CreateSVG: createSVG,
        CreateAxis: createAxis,
        UpdateAxis: updateAxis,
        ScaleBand: scaleBand,
        ScaleLinear: scaleLinear,
    }
}

function getPieChartData(nodes, user) {
    return nodes.filter((d) => d.id == user)[0]["games"]
}
function getLineChartData(summary, user, key) {
    lineChart_data = []
    summary.forEach(data => {
        var date = data["date"];
        var weekday = ['SUN', 'MON', 'TUE', 'WEN', 'THU', 'FRI', 'SAT'];
        var d = new Date(2000 + date.slice(0,2), 
                         date.slice(2,4) - 1,
                         date.slice(4,6)); // month = 0 ~ 11
        var value =  data.summary[user].averageViewers[key]
        lineChart_data.push({
            [key] : value ? value : 0.0,
            date : weekday[d.getDay()]
        });
    });

    return lineChart_data;
}