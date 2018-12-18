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

    let _y2AxisID, _y2Ticks

    const createAxis = (svg, width, height,
                        xid, xScale,
                        yid, yScale,
                        xTicks = 10, yTicks = 10) => {
        _xAxisID = xid
        _yAxisID = yid
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
    const createYAxis = (svg, width, height, id, yScale, ticks) => {
        _y2AxisID = id
        svg.append('g')
           .attr('id', _y2AxisID)
           .attr('transform', translate(width, 0))
           .call(d3.axisRight(yScale).ticks(ticks))
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

    const updateYAxis = (svg, yScale, duration = 0, ticks = 10) => {
        svg.select('#' + _y2AxisID)
           .transition()
           .duration(duration)
           .call(d3.axisRight(yScale).ticks(ticks))
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
        CreateYAxis: createYAxis,
        UpdateAxis: updateAxis,
        UpdateYAxis : updateYAxis,
        ScaleBand: scaleBand,
        ScaleLinear: scaleLinear,
    }
}

function getTableData(nodes, user, platform) {
    if (platform == 'youtube') {
        let userNode = nodes.filter((d) => d.id == user)[0]
        if (!userNode) return

        return [
            { 'subject': 'Recent Average View',
              'value': `${userNode['recent_average_view'].toFixed(0)} \
                       (${(100 - 100 * allYoutubeRankMap['recent_average_view'][user]['rank'] / Object.keys(allYoutubeRankMap['recent_average_view']).length ).toFixed(2)} %)`},
            { 'subject': 'Subscriber Count',
              'value': `${userNode['subscriber_count']} \
                       (${(100 - 100 * allYoutubeRankMap['subscriber_count'][user]['rank'] / Object.keys(allYoutubeRankMap['subscriber_count']).length ).toFixed(2)} %)`},
            { 'subject': 'PRA score',
              'value': `${userNode['pra_score'].toFixed(2)} \
                       (${(100 - 100 * allYoutubeRankMap['pra_score'][user]['rank'] / Object.keys(allYoutubeRankMap['pra_score']).length ).toFixed(2)} %)`},
            { 'subject': 'Potential',
              'value': `${(scoreRankMap['youtube_potential'][user]['score'] / all_youtube_max_potential).toFixed(2)}\
                        (${(100 - 100 * allScoreRankMap['youtube_potential'][user]['rank'] / Object.keys(allScoreRankMap['youtube_potential']).length).toFixed(2)} %)`},
            { 'subject': 'Total Stream Duration',
              'value': '-'},
        ]
    }
    if (platform == 'twitch') {
        let userNode = nodes.filter((d) => d.id == user)[0]
        if (!userNode) return

        return [
            { 'subject': 'Recent Average Viewer',
              'value': `${userNode['average_viewer']['viewer'].toFixed(0)} \
                       (${(100 - 100 * allTwitchRankMap['average_viewer'][user]['rank'] / Object.keys(allTwitchRankMap['average_viewer']).length ).toFixed(2)} %)`},
            { 'subject': 'Follower Count',
              'value': `${userNode['followers']} \
                       (${(100 - 100 * allTwitchRankMap['followers'][user]['rank'] / Object.keys(allTwitchRankMap['followers']).length ).toFixed(2)} %)`},
            { 'subject': 'SRA score',
              'value': `${userNode['sra_score'].toFixed(2)} \
                       (${(100 - 100 * allTwitchRankMap['sra_score'][user]['rank'] / Object.keys(allTwitchRankMap['sra_score']).length ).toFixed(2)} %)`},
              { 'subject': 'Potential',
              'value': `${(scoreRankMap['twitch_potential'][user]['score'] / all_twitch_max_potential).toFixed(2)}\
                        (${(100 - 100 * allScoreRankMap['twitch_potential'][user]['rank'] / Object.keys(allScoreRankMap['twitch_potential']).length).toFixed(2)} %)`},
            { 'subject': 'Total Stream Duration',
              'value': userNode['average_viewer']['duration'].toFixed(2)},
        ]
    }
    return null
}

function getPieChartData(nodes, user) {
    return nodes.filter((d) => d.id == user)[0]['games']
}
function getIntegratedChartData(summary, user) {
    let chart_data = new Array(7)
    summary.forEach(data => {
        var date = data['date']
        var weekday = ['SUN', 'MON', 'TUE', 'WEN', 'THU', 'FRI', 'SAT']
        var d = new Date(2000 + date.slice(0,2), 
                         date.slice(2,4) - 1,
                         date.slice(4,6)) // month = 0 ~ ///11
        var summary = data.summary[user]
        var viewer =  summary ? summary.averageViewers['viewer'] : 0.0
        var duration =  summary ? summary.averageViewers['duration'] : 0.0
        var week_index = d.getDay()
        var mostPlayedGame = summary ? getMostPlayedGame(summary['games']) : ""  
        chart_data[week_index] = {
            'viewer' : viewer ? viewer : 0.0,
            'duration' : duration ? duration : 0.0,
            'date' : weekday[week_index],
            'game' : mostPlayedGame['game']
        }
    })

    return chart_data
}
function getMostPlayedGame(games) {
    if (games[0]) {
        return games.reduce((most, R) => {
                return R.duration > most.duration ? R : most
            }, { 'game' : '', 'duration' : 0.0 })
    }
    else {
        return 'Not in Game List'
    }
}

function initScoreMap() {
    return {
        'youtube' : {
            'pra' : [],
            'link' : {} 
        },
        'twitch' : {
            'sra' : [],
            'link' : {} 
        },
        'score' : []
    }
}

var gameKeyMap = [
    "ALL",
    "Lost Ark Online",
    "League of Legends",
    "Fortnite",
    "PLAYERUNKNOWN'S BATTLEGROUNDS",
    "Just Chatting",
    "Hearthstone",
    "Overwatch",
    "Others"
]

var gameColorMap = {
    "Lost Ark Online" : "#C5AE87",
    "League of Legends" : "#0072C6",
    "Fortnite" : "#A947C9",
    "PLAYERUNKNOWN'S BATTLEGROUNDS" : "#87CEEB",
    "Just Chatting" : "#F97976",
    "Hearthstone" : "#00D044",
    "Overwatch" : "#FADA5E",
    "Others" : "#AAAAAA"
}