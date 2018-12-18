function Tooltip(parent = 'body', classname = 'tooltip') {
    // Define a div for a tooltip
    return d3.select(parent)
             .append('div')
             .attr('class', classname)
             .style('opacity', 0)
}

function AddTooltipEvent(tooltip_obj, target_ids = [], output_text ="") {
    target_ids.forEach(id => {
        d3.select('#' + id)
          .on('mouseover', function() {
              tooltip_obj.transition()
                         .duration(300)
                         .style('opacity', 0.9)
              tooltip_obj.html(output_text)	
                         .style("left", (d3.event.pageX) + "px")		
                         .style("top", (d3.event.pageY - 28) + "px");	
          })
          .on('mouseout', function() {
              tooltip_obj.transition()
                         .duration(300)
                         .style('opacity', 0)
          })
    });
}

var tooltipMessages = {
    'alpha' : 'Alpha : Control the platform influence ratio between YouTube and TwitchTV',
    'beta' : 'Beta : Control the weight of influence score about each platform',
    'dropout' : 'Dropout : Set the threshold to discard links',
    'view' : 'Recent Average View Count : Show the influence in aspect of view</br>\
              Youtube : Average video views over the last 3 weeks</br>\
              TwitchTV : Average viewers of streaming over the week',
    'follower' : 'Follower Count : Show the influence in aspect of view</br>\
              Youtube : The number of subscribers</br>\
              TwitchTV : The number of followers',
    'score' : 'Custom score summary</br>\
              PRA : Sum of view weight of user about videos that an user is tagged in YouTube platform</br>\
              SRA : Sum of viewer weight of user about streamers that an user is followed in TwitchTV platform'
}