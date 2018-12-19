function InitIntroduction(id = 'intro') {
    let dom = document.getElementById(id);

    let intro = `&nbsp 최근 <strong>게임 비디오 컨텐츠 시장</strong>은 급속도로 성장하고 있으며 그 규모는 약 32조에 달한다.\
                 그 중에서도 광고 시장의 규모는 약 16조로 굉장히 큰 비중을 차지하고 있으며 이는 비디오 컨텐츠 제공자의 영향력이 그만큼 크다는 것을 의미한다.\
                 광고주들의 입장에서는 <strong>영향력이 큰 컨텐츠 제공자</strong>를 찾는 것을 원할 것이고, 이를 시각화해서 보여준다면 효율적인 투자가 가능할 것이다.\
                 </br>`
    intro += `&nbsp 게임 스트리밍 플랫폼은 여러 가지가 존재하며 그 중에서도 가장 큰 비중을 차지하는 플랫폼으로는 <strong>YouTube와 TwitchTV</strong>가 있다.\
              <strong>YouTube와 Twitch</strong>에서는 기본적인 분석툴을 제공한다.\
              그러나 일반적으로 비디오 컨텐츠 제공자는 여러 플랫폼을 <strong>동시에</strong> 이용하는 경우가 많기 때문에 이러한 분석툴에서 얻는 정보만으로는 정확한 영향력을 파악할 수 없다.\
              </br>`

    intro += `&nbsp Twitube는 <strong>YouTube와 TwitchTV</strong>의 종합적인 영향력을 분석하여 기존의 문제점을 해결하고 정확한 영향력을 시각화해서 보여주는 Application 이다.`
    dom.innerHTML = intro;
}