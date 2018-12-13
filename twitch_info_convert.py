import json
import sys
import os

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

def getDailyViewer(data):
    ban_keyword = ['top_game', 'live_streams', 'stream_summary']
    dailyViewers = {}
    for datum in data:
        for key, value in datum.items():           
            if  key not in ban_keyword \
                and'viewers' in value['streams'] :
                if (not key in dailyViewers):
                    dailyViewers[key] = []
                dailyViewers[key].append(value['streams']['viewers'])
    return dailyViewers
def getAverageViewers(data):
    averageViewers = {}
    dailyViewers = getDailyViewer(data)
    for user, viewer in dailyViewers.items():
        averageViewers[user] = {
            'viewer' :  sum(viewer) / len(viewer),
            'duration' : len(viewer) / 2
        }
    
    return averageViewers

def TwitchConvert(date = '181210', data_dir = 'twitch_data'):
    base_dir = os.path.join(os.path.dirname(__file__), data_dir)

    data = readDailyFiles(base_dir, date)

    users = data[0].keys()

    averageViewers = getAverageViewers(data)
    print(averageViewers)

if __name__ == '__main__':
    #TwitchConvert('18' + str(sys.argv[1]))
    TwitchConvert('181210')