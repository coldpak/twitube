import json
import os

from weekly_converter import *

def TwitchConvert(date = '181210', data_dir = 'twitch_data', out_dir = 'data'):
    base_dir = os.path.dirname(__file__)

    weekly_data = readWeeklyFiles(os.path.join(base_dir, data_dir), date)

    weekly_users = getWeeklyUsers(weekly_data)
    weekly_influence_data = getWeeklyInfluenceData(weekly_data)
    weekly_link_data = getWeeklyLinkData(weekly_data, os.path.join(base_dir, 'twitch-targets.json'))
    weekly_score_summary = getWeeklyScoreSummary(weekly_users, weekly_influence_data, weekly_link_data)
    weekly_SRA = getSRA(weekly_score_summary)
    weekly_summary = getWeeklySummary(weekly_users, weekly_influence_data)
    weekly_influence_summary = getWeeklyInfluenceSummary(weekly_summary)
    weekly_average_game_share = getWeeklyAverageGameShare(weekly_influence_data) 
    
    weekly_nodes = createNode(weekly_influence_summary, weekly_SRA)
    weekly_links = createLink(weekly_score_summary)
    
    output = {
        'nodes' : weekly_nodes,
        'links' : weekly_links,
        'statistics' : {
            'weekly_summary' : weekly_summary,
            'weekly_average_share' : weekly_average_game_share,
        }
    }

    with open(out_dir + '/' + 'twitch-' + date + '.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=4, separators=(',', ': '), ensure_ascii=False)

    print('done!!')

if __name__ == '__main__':
    #TwitchConvert('18' + str(sys.argv[1]))
    TwitchConvert('181214')