import json
import os

from twitch.daily_converter import getSRA, getNormalizedSRA, getNormalizedScore, createNode, createLink
import twitch.weekly_converter as wc

def TwitchConvert(date = '181210', data_dir = 'twitch_data', out_dir = '../../data'):
    weekly_data = wc.readWeeklyFiles(data_dir, date)

    weekly_users = wc.getWeeklyUsers(weekly_data)
    weekly_influence_data = wc.getWeeklyInfluenceData(weekly_data)
    weekly_link_data = wc.getWeeklyLinkData(weekly_data)
    weekly_score_summary = wc.getWeeklyScoreSummary(weekly_users, weekly_influence_data, weekly_link_data)
    weekly_SRA = getSRA(weekly_score_summary)
    weekly_summary = wc.getWeeklySummary(weekly_users, weekly_influence_data)
    weekly_influence_summary = wc.getWeeklyInfluenceSummary(weekly_summary)
    weekly_average_game_share = wc.getWeeklyAverageGameShare(weekly_influence_data) 
    
    # get normalized scores
    weekly_normalized_SRA = getNormalizedSRA(weekly_SRA)
    weekly_normalized_score_summary = getNormalizedScore(weekly_score_summary)
    
    # make a name list of streamers
    alias = { name : name.split('_')[0] for name in weekly_users[0]['users'] }
    alias["이선생84"] = '이선생'
    alias["갱생레바"] = '레바'
    alias["서새봄냥"] = '서새봄'
    alias["연두는말안드뤄"] = '연두'
    alias["형독방송"] = '형독'
    alias["날게렌"] = '게렌'
    alias["흐쟁이덩"] = '흐쟁이'

    weekly_nodes = createNode(weekly_influence_summary, weekly_SRA, weekly_normalized_SRA, alias)
    weekly_links = createLink(weekly_score_summary, weekly_normalized_score_summary)

    weekly_normalized_sra = getNormalizedSRA(weekly_SRA)
    weekly_normalized_score_summary = getNormalizedScore(weekly_score_summary)

    output = {
        'nodes' : weekly_nodes,
        'links' : weekly_links,
        'statistics' : {
            'weekly_summary' : weekly_summary,
            'weekly_average_share' : weekly_average_game_share,
        }
    }

    with open(os.path.join(out_dir, 'twitch-' + date + '.json'), 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=4, separators=(',', ': '), ensure_ascii=False)

    print('twitch preprocessing done!!')
