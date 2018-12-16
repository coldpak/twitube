import twitch.daily_converter as dc
import datetime as dt

def readWeeklyFiles(data_dir, date):
    base_time = dt.datetime(2000 + int(date[0:2]), int(date[2:4]), int(date[4:6]))
    weekly_data = []
    for i in range(0, 5) :
        time = base_time - dt.timedelta(i)
        date = '%2d%2d%2d' %(time.year - 2000, time.month, time.day)
        daily_data = dc.readDailyFiles(data_dir, date)
        weekly_data.append({ 'data' : daily_data, 'date' : date })
    return weekly_data

def getWeeklyInfluenceData(weekly_data):
    weekly_influence_data = []
    for daily_data in weekly_data :
        weekly_influence_data.append(dc.getInfluenceData(daily_data))
    return weekly_influence_data

def getWeeklyLinkData(weekly_data, target_path = 'twitch-targets.json'):
    weekly_link_data = []
    for daily_data in weekly_data :
        data = daily_data['data']
        if len(data) > 0 :
            weekly_link_data.append(dc.getLinkData(data[0], target_path))
        else :
            weekly_link_data.append({})
    return weekly_link_data

def getWeeklyUsers(weekly_data) :
    weekly_users = []
    for daily_data in weekly_data :
        data = daily_data['data']
        date = daily_data['date']
        if len(data) > 0 :
            weekly_users.append({
                'users' : data[0].keys(),
                'date' : date
            })
        else :
            weekly_users.append({
                'users' : [],
                'date' : date
            }) 
    return weekly_users

def getWeeklyScoreSummary(weekly_users, weekly_influence_data, weekly_link_data) :
    weekly_score = {}

    for i in range(0, len(weekly_users)) :
        daily_score = dc.getScore(weekly_users[i]['users'], \
                                  weekly_influence_data[i], \
                                  weekly_link_data[i])
        for user, value in daily_score.items() :
            if not user in weekly_score :
                weekly_score[user] = {}
            for target, daily_score in value.items() :
                if not target in weekly_score[user] :
                    weekly_score[user][target] = []
                weekly_score[user][target].append(daily_score)

    weekly_score_summary = {}
    for user, value in weekly_score.items() :
        weekly_score_summary[user] = {}
        for target, daily_scores in value.items() :
            weekly_score_summary[user][target] = sum(daily_scores) / len(daily_scores)
    return weekly_score_summary

def getWeeklySummary(weekly_users, weekly_influence_data) :
    weekly_summary = []
    for i in range(0, len(weekly_users)) :
        weekly_summary.append({
            'summary' : dc.getSummary(weekly_users[i]['users'], weekly_influence_data[i]),
            'date' : weekly_users[i]['date']
        })
    return weekly_summary

def getWeeklyInfluenceSummary(weekly_summary) :
    weekly_influence = {}
    for daily_summary in weekly_summary :
        summary = daily_summary['summary']
        if len(summary) > 0 :
            for user, value in summary.items() :
                if not user in weekly_influence :
                    weekly_influence[user] = {
                        'averageViewers' : {
                            'viewer' : [],
                            'duration' : [],
                        },
                        'followers' : [],
                        'games' : {},
                    }
                if len(value['averageViewers']) > 0 :
                    weekly_influence[user]['averageViewers']['viewer'].append(value['averageViewers']['viewer'])
                    weekly_influence[user]['averageViewers']['duration'].append(value['averageViewers']['duration'])
                weekly_influence[user]['followers'].append(value['followers'])
                for game_data in value['games'] :
                    game = game_data['game']
                    duration = game_data['duration']
                    if not game in weekly_influence[user]['games'] :
                        weekly_influence[user]['games'][game] = []
                    weekly_influence[user]['games'][game].append(duration)
            
    
    weekly_influence_summary = {}
    for user, value in weekly_influence.items() :
        weekly_influence_summary[user] = {
            'averageViewers' : {
                'viewer' : sum(value['averageViewers']['viewer']) / len(value['averageViewers']['viewer']) if len(value['averageViewers']['viewer']) > 0 else 0.0 ,
                'duration' : sum(value['averageViewers']['duration'])
            },
            'followers' : value['followers'],
            'games' : []
        }
        for game, duration in value['games'].items() :
            weekly_influence_summary[user]['games'].append({
                'game': game,
                'duration' : sum(duration)
            })

    return weekly_influence_summary

def getWeeklyAverageGameShare(weekly_influence_data) :
    weekly_game_statistics = {}
    for daily_influence_data in weekly_influence_data :
        for game, value in daily_influence_data['averageShare'].items() :
            if not game in weekly_game_statistics :
                weekly_game_statistics[game] = {
                    'share' : [],
                    'duration' : []
                }
            weekly_game_statistics[game]['share'].append(value['share'])
            weekly_game_statistics[game]['duration'].append(value['duration'])

    weekly_game_statistics_summary = []
    for game, value in weekly_game_statistics.items() :
        weekly_game_statistics_summary.append({
            'game' : game,
            'share' : sum(value['share']) / len(value['share']),
            'duration' : sum(value['duration'])
        })
    return weekly_game_statistics_summary