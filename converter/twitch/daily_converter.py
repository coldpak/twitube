import json
import sys
import os
import math

not_streamer = ['top_game', 'live_streams', 'stream_summary']

def convertToListValue(target_with_dict_value, key_name, value_name) :
    converted = {}
    for user, value in target_with_dict_value.items():
        converted[user] = []
        for key, value in value.items() :
            converted[user].append({
                key_name : key,
                value_name : value
            })
    return converted

def readDailyFiles(data_dir, date = '181210'):
    try:
        daily_data = []
        for i in range(0, 48):
            time = date + '%02d%02d' % (i/2, (30 * i) % 60)
            with open(os.path.join(data_dir, time + '.json'), encoding = 'utf-8') as f:
                daily_data.append(json.load(f))
        return daily_data
    except:
        return []

def getAverage(data, target = 'value'):
    average = {}
    max_viewer = 0.0
    sum_viewer = 0
    for key, value in data.items():
        sum_viewer += sum(value)
        average_viewer = sum(value) / len(value)
        if average_viewer > max_viewer :
            max_viewer = average_viewer
        average[key] = {
            target : average_viewer,
            'duration' : len(value) / 2,
        }
    if target == 'viewer' :
        for key in data.keys():
            average[key]['normalized_' + target] = math.sqrt(average[key][target] / max_viewer)
            average[key]['sum_viewer'] = sum_viewer
    return average

def getInfluenceData(data_list): 
    daily_viewers = {}
    followers = {}
    games = {}
    shares = {}

    for data in data_list['data']:
        for key, value in data.items():           
            if  key not in not_streamer :
                # Process data if there is streams key
                if 'viewers' in value['streams'] :
                    viewers = value['streams']['viewers']
                    game = value['streams']['game']

                    # Get daily viewers
                    if not key in daily_viewers:
                        daily_viewers[key] = []
                    daily_viewers[key].append(viewers)
                   
                   # Get game list the streamer played
                    if not key in games:
                        games[key] = {}
                    if not game in games[key]:
                        games[key][game] = 1/2
                    else :
                        games[key][game] += 1/2

                # Get the number of followers
                if 'channels' in value :
                    followers[key] = value['channels']['followers']

            else :
                if key == 'top_game':
                    # total_channels = sum(t['channels'] for t in value['top'])
                    total_viewers = sum(t['viewers'] for t in value['top'])
                    top_games_moment = sorted(value['top'], key = lambda x: x['channels'], reverse = True)
                    for top_game in top_games_moment:
                        game = top_game['game']['name']
                        if not game in shares:
                            shares[game] = []
                        # channel_score = top_game['channels']
                        viewers = top_game['viewers']
                        shares[game].append(viewers / total_viewers)
                elif key == 'live_streams':
                    pass
                elif key == 'stream_summary':
                    pass

    return {
        'averageViewers' : getAverage(daily_viewers, 'viewer'),
        'followers' : followers,
        'games' : convertToListValue(games, key_name='game', value_name='duration'),
        'averageShare' : getAverage(shares, 'share'),
    }

def getLinkData(data):
    link_data = {}

    for key, value in data.items():
        if key not in not_streamer :
            link_data[key] = list(filter(lambda x : x in data.keys(), value['follows']))
    return link_data
    
def getSummary(users, influence_data):
    summary = {}
    for user in users:
        if user not in not_streamer :
            summary[user] = {
                'averageViewers' : influence_data['averageViewers'][user] if user in influence_data['averageViewers'] else {},
                'followers' : influence_data['followers'][user] if user in influence_data['followers'] else {},
                'games' : influence_data['games'][user] if user in influence_data['games'] else {},
            }
    return summary

def getNormalizedScore(scores) :
    normalized_scores = {}

    max_score = 0.0
    for user, targets in scores.items() :
        for target, score in targets.items() :
            if scores[user][target] > max_score :
                max_score = scores[user][target]

    for user, targets in scores.items() :
        normalized_scores[user] = {}
        for target, score in targets.items() :
            normalized_scores[user][target] = math.sqrt(scores[user][target] / max_score)

    return normalized_scores

def getScore(users, influence_data, link_data):
    average_viewers = influence_data['averageViewers']
    scores = {}
    for user in users:
        if user not in not_streamer :
            scores[user] = {}
            for target in link_data[user] :
                if user in average_viewers and target in average_viewers :
                    scores[user][target] = average_viewers[user]['viewer'] / average_viewers[target]['viewer']
    return scores

def getNormalizedSRA(SRA) :
    normalized_SRA = {}
    max_sra = max(SRA.values())

    for target, sra in SRA.items() :
        normalized_SRA[target] = math.sqrt(sra / max_sra)
    
    return normalized_SRA

def getSRA(score_summary) :
    sra = {}
    for user, scores in score_summary.items() :
        for target in scores.keys() :
            if not target in sra :
                sra[target] = 0.
            sra[target] += score_summary[user][target]
    return sra

def normalized_follower():
    pass

def createNode(influence_summary, SRA, normalized_SRA, alias) :
    nodes = []
    for user, data in influence_summary.items() :
        nodes.append({
            'id' : user,
            'alias' : alias[user],
            'average_viewer' : data['averageViewers'],
            'games' : data['games'],
            'followers' : data['followers'],
            'normalized_followers' : data['normalized_followers'],
            'sra_score' : SRA[user] if user in SRA else 0.0,
            'normalized_sra_score' : normalized_SRA[user] if user in normalized_SRA else 0.0
        })
    
    return nodes

def createLink(score_summary, normalized_score_summary) :
    links = []
    for user, targets in score_summary.items() :
        for target, score in targets.items() :
            links.append({
                'source' : user,
                'target' : target,
                'score' : score,
                'normalized_score' : normalized_score_summary[user][target]
            })
    return links