var summary_map = new Array(9)

function getSummaryTemplate(_user, _checkedGames, _youtubeRankMap, _twitchRankMap, _scoreRankMap) {
    if (_user.length == 0 || !scoreRankMap['mra_score'][_user]) return '';

    let summary = getFilterSummary(_checkedGames)
    
    summary += `${_user} 는, </br>`

    summary += 'YouTube '
    summary += getPlatformSummary(_user, _youtubeRankMap, 'recent_average_view')
    summary += ', ' + getPlatformSummary(_user, _youtubeRankMap, 'subscriber_count')
    summary += ', ' + getPlatformSummary(_user, _youtubeRankMap, 'pra_score')

    summary += '</br>'

    summary += 'TwitchTV '
    summary += getPlatformSummary(_user, _twitchRankMap, 'average_viewer')
    summary += ', ' + getPlatformSummary(_user, _twitchRankMap, 'followers')
    summary += ', ' + getPlatformSummary(_user, _twitchRankMap, 'sra_score')
    
    summary += '</br>'
    
    summary += '총점 (MRA Score)' + getScoreSummary(_user, _scoreRankMap, 'mra_score')
    
    summary += '</br>'
    
    summary += '비슷한 수준의'
    let checkbox_radius = document.getElementsByClassName('checkbox_radius')
    let youtubeTarget, twitchTarget
    if (checkbox_radius[0].checked){
        summary += ' 조회수/시청자수를'
        youtubeTarget = _youtubeRankMap['recent_average_view']
        twitchTarget = _twitchRankMap['average_viewer']
    }
    else if (checkbox_radius[1].checked){
        summary += ' 구독자수/팔로워수를'
        youtubeTarget = _youtubeRankMap['subscriber_count']
        twitchTarget = _twitchRankMap['followers']
    }
    else if (checkbox_radius[2].checked){
        summary += 'PRA/SRA Score를'
        youtubeTarget = _youtubeRankMap['pra_score']
        twitchTarget = _twitchRankMap['sra_score']
    }
    else {
        console.log('Error!!')
        return
    }

    let youtube_analysis =  getAnalysisBetweenSimilarUser(_user, youtubeTarget, _scoreRankMap),
        twitch_analysis =  getAnalysisBetweenSimilarUser(_user, twitchTarget, _scoreRankMap)
    let avg_score = (youtube_analysis.sum + twitch_analysis.sum) / (youtube_analysis.count + twitch_analysis.count),
        top = scoreRankMap['mra_score'][youtube_analysis.top]['rank'] < scoreRankMap['mra_score'][twitch_analysis.top]['rank']
              ? youtube_analysis.top : twitch_analysis.top
    summary += ' 가지는 사람들의 평균의'
    
    let influence_rate  = 100 + 100 * (_scoreRankMap['mra_score'][_user]['score'] - avg_score) / avg_score
    if (influence_rate >  100) summary += '<strong>'
    else { summary += `<font color="red">`}
    summary += ` ${influence_rate.toFixed(2)} %`
    if (influence_rate >  100) summary += '</strong>'
    else { summary += '</font>'}
    summary += ' 에 해당하는 영향력을 가진다.'
    
    summary += '</br>'
    
    summary += `비슷한 유저들 중에서 가장 큰 영향력을 가지는 유저는 <strong>${top}</strong> 이다`
    
    summary += '</br>'

    let youtube_potential_rank = _scoreRankMap['youtube_potential'][_user]['score'] / youtube_max_potential,
        twitch_potential_rank = _scoreRankMap['twitch_potential'][_user]['score'] / twitch_max_potential
    if (youtube_potential_rank > 0.7 && twitch_potential_rank > 0.7) {
        summary += '<strong>이 유저는 모든 플랫폼에서 잠재력이 크기 때문에 기대 이상의 효과를 볼 수 있을 것이다.</strong>'
    }
    else if (youtube_potential_rank > 0.7) {
        summary += '이 유저는 유튜브 잠재력이 크기 때문에 <strong>동영상 플랫폼</strong>에 적합한 광고를 하면 기대 이상의 효과를 볼 수 있을 것이다.'
    }
    else if (twitch_potential_rank > 0.7){
        summary += '이 유저는 트위치 잠재력이 크기 때문에 <strong>실시간 방송</strong>에 적합한 광고를 하면 기대 이상의 효과를 볼 수 있을 것이다.'
    }

    return summary
}

function getFilterSummary(obj) {
    let summary = '게임'
    Object.keys(obj).forEach((key) => {
        summary += obj[key] ? ` ${key},` : ''
    })
    summary = summary.substring(0, summary.length -1)
    summary += '에 대해 고려했을 때 </br>'

    return summary
}

function getPlatformSummary(user, obj, key) {
    let summary = '', keyword = '',
        rank = (100 - 100 * obj[key][user]['rank'] / Object.keys(obj[key]).length).toFixed(2)
    
    switch (key) {
        /* YouTube Text */
        case 'recent_average_view':
            keyword = '평균 조회수'
            break
        case 'subscriber_count':
            keyword = '구독자수'
            break
        case 'pra_score':
            keyword = 'PRA Score'
            break
        /* TwitchTV Text */
        case 'average_viewer':
            keyword = '평균 시청자수'
            break
        case 'followers':
            keyword = '팔로워수'
            break
        case 'sra_score':
            keyword = 'SRA Score'
            break
    }

    if (rank >  70) summary += '<strong>'
    summary += ` ${keyword} 에서`
    summary += ` 상위 ${rank} %`
    if (rank >  70) summary += '</strong>'

    return summary
}

function getScoreSummary(user, obj, key) {
    let summary = '', keyword = '',
        score = obj[key][user] ? obj[key][user]['score'] : 0.0,
        rank = (100 - 100 * obj[key][user]['rank'] / Object.keys(obj[key]).length).toFixed(2)
    switch (key) {
        case 'mra_score' :
            keyword = '총점(MRA Score) '
            break;
    }

    if (rank >  70) summary += '<strong>'
    summary += ` ${score.toFixed(2)}`
    summary += ` 으로 (상위 ${rank} %) 의 영향력을 보여주고 있다.`
    if (rank >  70) summary += '</strong>'

    return summary
}

function getAnalysisBetweenSimilarUser(user, obj, scoreRankMap) {
    let sum = 0, count = 0, maxScore = 0, top;
    let rank = obj[user]['rank']
    Object.keys(obj).forEach((key, i) => {
        if (obj[key]['rank'] < rank + 3 && obj[key]['rank'] > rank - 3 && scoreRankMap['mra_score'][key]) {
            let score = scoreRankMap['mra_score'][key]['score']
            sum += score
            count++;
            if (score > maxScore) { 
                top = key
                maxScore = score
            } 
        }
    })
    return {
        'sum' : sum,
        'count' : count,
        'top' : top,
    }
}

function showSummary(user) {
    let summaryText = getSummaryTemplate(user,
                                         checkedGames,
                                         youtubeRankMap,
                                         twitchRankMap,
                                         scoreRankMap)
    document.querySelector('.info_recommend .summary').innerHTML = summaryText
}