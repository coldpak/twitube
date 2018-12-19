function InitIntroduction(id = 'intro') {
    let dom = document.getElementById(id);

    /*
    let intro = `&nbsp 최근 <strong>게임 비디오 컨텐츠 시장</strong>은 급속도로 성장하고 있으며 그 규모는 약 32조에 달한다.\
                 그 중에서도 광고 시장의 규모는 약 16조로 굉장히 큰 비중을 차지하고 있으며 이는 비디오 컨텐츠 제공자의 영향력이 그만큼 크다는 것을 의미한다.\
                 광고주들의 입장에서는 <strong>영향력이 큰 컨텐츠 제공자</strong>를 찾는 것을 원할 것이고, 이를 시각화해서 보여준다면 효율적인 투자가 가능할 것이다.\
                 </br>`
    intro += `&nbsp 대표적인 게임 스트리밍 플랫폼으로는 <strong>YouTube와 TwitchTV</strong>가 있으며 각각의 플랫폼에서는 기본적인 분석툴을 제공한다.\
              그러나 일반적으로 비디오 컨텐츠 제공자는 여러 플랫폼을 <strong>동시에</strong> 이용하는 경우가 많기 때문에 이러한 분석툴에서 얻는 정보만으로는 정확한 영향력을 파악할 수 없다.\
              </br>`

    intro += `&nbsp Twitube는 <strong>YouTube와 TwitchTV</strong>의 종합적인 영향력을 분석하여 기존의 문제점을 해결하고 정확한 영향력을 시각화해서 보여주는 Application 이다.`
    */
   let intro = `&nbsp <strong>Twitube</strong>는 비디오 컨텐츠 제공자의 <strong>TwitchTV와 YouTube</strong>에서의 종합적인 영향력을 시각화하는 어플리케이션이다.\
                </br></br>`
    intro += `&nbsp 기존에는 각각의 플랫폼에서 제공하는 분석툴으로 비디오 컨텐츠 제공자의 해당 플랫폼에서의 영향력은 파악할 수있었으나, 종합적인 영향력을 파악할 수 없었다.\
              </br></br>`
    intro += `&nbsp <strong>Twitube</strong>에서는 각 플랫폼에서의 비슷한 특성을 가지는 정보들을 분류하고 종합적으로 분석함으로써 <strong>TwitchTV와 YouTube</strong>를 모두 고려한 종합적인 영향력을 시각화하였다.\
              </br></br>`
    intro += `&nbsp 네트워크 그래프를 통해 각 정보들을 기준으로한 비디오 컨텐츠 제공자들 사이의 연관성과 영향력을 파악할 수 있으며, 차트, 테이블, 그리고 제안을 통해 특정 컨텐츠 제공자에 대한 요약 정보를 확인할 수 있다.`
    dom.innerHTML = intro;
}