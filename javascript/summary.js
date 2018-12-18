var summary_map = new Array(9)

function getSummaryTemplate(_user, _checkedGames, _youtubeRankMap, _twitchRankMap, _scoreRankMap) {
    if (_user.length == 0) return;

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
    
    checkbox_radius = document.getElementsByClassName('checkbox_radius')
    summary += '비슷한 수준의'
    if (checkbox_radius[0].checked){
        summary += ' 조회수/시청자수를'
    }
    else if (checkbox_radius[1].checked){
        summary += ' 구독자수/팔로워수를'
    }
    else if (checkbox_radius[2].checked){
        summary += 'PRA/SRA Score를'
    }
    else {
        console.log('Error!!')
        return
    }

    /* TODO */
    summary += ' 가지는 사람들 보다...% 정도 더 뛰어난/떨어지는'
    summary += '이 가운데 1등은 ... xxx 이다'

    summary += '이 유저의 유튜브 잠재력은... 으로 동영상 플랫폼에 적합한 광고를 하면 기대 이상의 효과를 볼 수 있을 것이다.'
    summary += '이 유저의 트위치 잠재력은... 으로 실시간 방송에 적합한 광고를 하면 기대 이상의 효과를 볼 수 있을 것이다.'

    document.querySelector('.info_recommend .summary').innerHTML = summary
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
        score = obj[key][user]['score'] ? obj[key][user]['score'] : 0.0,
        rank = (100 - 100 * obj[key][user]['rank'] / Object.keys(obj[key]).length).toFixed(2)
    switch (key) {
        case 'mra_score' :
            keyword = '총점(MRA Score) '
            break;
    }

    if (rank >  70) summary += '<strong>'
    summary += ` ${score.toFixed(2)}`
    summary += ` (상위 ${rank} %) 의 영향력을 보여주고 있다.`
    if (rank >  70) summary += '</strong>'

    return summary
}