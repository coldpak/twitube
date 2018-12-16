#!/usr/bin/env python
# -*- coding: utf-8 -*- 
import json
import sys
import os

def YoutubeConvert(date, data_dir, out_dir="data"):
    """
    This function converts raw json data of Youtube crawler to refined one.
    """
    try:
        with open(os.path.join(data_dir, date + '0000.json'), encoding='utf-8') as file:
            raw_data = json.load(file)
    except:
        print("Error: Cannot open file")
        sys.exit(1)

    # make a name list of streamers
    names = {name: name.split("_")[0] for name in raw_data['Channels']}
    namesArray = [name for name in raw_data['Channels']]
    # for outliners...
    names["이선생84"] = '이선생'
    names["갱생레바"] = '레바'
    names["서새봄냥"] = '서새봄'
    names["연두는말안드뤄"] = '연두'
    names["형독방송"] = '형독'
    names["날게렌"] = '게렌'
    names["흐쟁이덩"] = '흐쟁이'
    num = len(namesArray)
    # Park Rank Algorithm(PRA) for video tags
    invalidTags = ['샤이니', '더샤이', '게임']
    pra_score_list = {}
    recent_average_view_array = []
    links = [[[0 for _ in range(2)] for _ in range(num)] for _ in range(num)]
    for key, videos in raw_data['Videos'].items():
        source = namesArray.index(key)
        # print('from: ', namesArray[source])
        recent_view_count = 0
        recent_average_view_count = 0
        for video in videos:
            recent_view_count += int(video['statistics']['viewCount'])
            for tag in video['tags']:
                if tag not in invalidTags:
                    # self tag doesn't add score to rank
                    alpha = 1.0 / len(video['tags'])
                    vs = video['statistics']
                    video_score = float(vs['viewCount']) + float(vs['favoriteCount'])
                    # + int(vs['likeCount']) - int(vs['dislikeCount']) + int(vs["favoriteCount"]
                    # TODO: some videos doesn't have likeCount
                    # TODO: 자기 자신과 같이 태그한 것들 처리. 필요한지는 의문.
                    if names[key] not in tag:
                        suggested_tag = None
                        for _key, name in names.items():
                            if key != _key and tag in name or name in tag:
                                suggested_tag = _key
                        if suggested_tag == None: continue
                        target = namesArray.index(suggested_tag)
                        links[source][target][0] += 1
                        links[source][target][1] += alpha * video_score
                        # print('to: ', namesArray[target], source, target, links[source][target])
        if len(videos) != 0:
            recent_average_view_count = recent_view_count / len(videos)
        recent_average_view_array.append(recent_average_view_count)
          
    # refined_data generation part
    refined_data={ 'nodes': [], 'links': [] }
    for i in range(num):
        for j in range(num):
            if links[i][j][0] != 0:
                link = {
                    'source': namesArray[i],
                    'target': namesArray[j],
                    'count' : links[i][j][0],
                    'score' : links[i][j][1]
                }
                refined_data['links'].append(link)
    for i in range(num):
        _id = namesArray[i]
        channel_infos = raw_data['Channels'][_id]
        node = {
            'id': _id,
            'alias': names[_id],
            'averageView': int(channel_infos["viewCount"])/int(channel_infos["videoCount"]),
            'recent_average_view': recent_average_view_array[i],
            'subscriberCount': int(channel_infos['subscriberCount']),
            'pra_score': 0,
            'inlink_count': 0,
            'outlink_count': 0,
            'pra_out_score': 0,
        }
        for j in range(num):
            node['inlink_count'] += links[j][i][0]
            node['pra_score'] += links[j][i][1]
            node['outlink_count'] += links[i][j][0]
            node['pra_out_score'] += links[i][j][1]
        refined_data['nodes'].append(node)

    # save data into json format
    with open(os.path.join(out_dir, 'youtube-' + date + '.json'), 'w', encoding='utf-8') as f:
        json.dump(refined_data, f, indent=4, separators=(',', ': '), ensure_ascii=False)
    
    print('youtube preprocessing done!!')