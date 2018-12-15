import json
import sys
import os

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
    for key, value in data.items():
        average[key] = {
            target : sum(value) / len(value),
            'duration' : len(value) / 2,
        }
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
                        games[key][game] = 1
                    else :
                        games[key][game] += 1

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

def getLinkData(data, target_path = 'twitch-targets.json'):
    link_data = {}
    with open(target_path, encoding='utf-8') as f:
        targets =  json.load(f).keys()

    for key, value in data.items():
        if key not in not_streamer :
            link_data[key] = list(filter(lambda x : x in targets, value['follows']))
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

def getSRA(score_summary) :
    sra = {}
    for user, scores in score_summary.items() :
        for target in scores.keys() :
            if not target in sra :
                sra[target] = 0.
            sra[target] += score_summary[user][target]
    return sra

def createNode(influence_summary, SRA, alias) :
    nodes = []
    for user, data in influence_summary.items() :
        nodes.append({
            'id' : user,
            'alias' : alias[user],
            'average_viewer' : data['averageViewers'],
            'games' : data['games'],
            'followers' : data['followers'],
            'sra_score' : SRA[user] if user in SRA else 0.0
        })
    
    return nodes

def createLink(score_summary) :
    links = []
    for user, targets in score_summary.items() :
        for target, score in targets.items() :
            links.append({
                'source' : user,
                'target' : target,
                'score' : score
            })
    return links