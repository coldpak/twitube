import json
import sys
import os

not_streamer = ['top_game', 'live_streams', 'stream_summary']

def readDailyFiles(base_dir, date = '181210'):
    try:
        data = []
        for i in  range(0, 48):
            time = date + '%02d%02d' % (i/2, (30 * i) % 60)
            with open(os.path.join(base_dir, time + '.json'), encoding = 'utf-8') as f:
                data.append(json.load(f))
        return data
    except:
        print('wrong input')
        sys.exit(-1)

def getAverage(data, target = 'value'):
    average = {}
    for key, value in data.items():
        average[key] = {
            target : sum(value) / len(value),
            'duration' : len(value) / 2,
        }
    return average

def InfluenceData(data_list): 
    daily_viewers = {}
    followers = {}
    games = {}
    shares = {}

    for data in data_list:
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
        'games' : games,
        'averageShare' : getAverage(shares, 'share'),
    }

def LinkData(data, target_path = 'twitch-targets.json'):
    link_data = {}
    with open(target_path, encoding='utf-8') as f:
        targets =  json.load(f).keys()

    for key, value in data.items():
        if  key not in not_streamer :
            link_data[key] = list(filter(lambda x : x in targets, value['follows']))

    return link_data

def Merge(users, influence_data, link_data):
    merged = {}
    for user in users:
        if  user not in not_streamer :
            merged[user] = {
                'averageViewers' : influence_data['averageViewers'][user] if user in influence_data['averageViewers'] else {},
                'followers' : influence_data['followers'][user] if user in influence_data['followers'] else {},
                'games' : influence_data['games'][user] if user in influence_data['games'] else {},
                'link' : link_data[user] if  user in link_data else [],
            }
    return merged

def TwitchConvert(date = '181210', data_dir = 'twitch_data', out_dir = 'data'):
    base_dir = os.path.dirname(__file__)

    data = readDailyFiles(os.path.join(base_dir, data_dir), date)

    users = data[0].keys()

    influence_data = InfluenceData(data)
    link_data = LinkData(data[0], os.path.join(base_dir, 'twitch-targets.json'))

    user_data = Merge(users, influence_data, link_data)
    summary_data = {
        'averageShare' : influence_data['averageShare']
    }

    output = {
        'user' : user_data,
        'summary' : summary_data,
    }
    
    with open(out_dir + '/' + 'twi' + date + '.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=4, separators=(',', ': '), ensure_ascii=False)

    print('done!!')

if __name__ == '__main__':
    #TwitchConvert('18' + str(sys.argv[1]))
    TwitchConvert('181210')