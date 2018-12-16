#!/usr/bin/env python
# -*- coding: utf-8 -*- 
import json
import sys
import os

def file_read(data_dir, date):
    try:
        with open(os.path.join(data_dir, 'twitch-' + date + '.json'), encoding = 'utf-8') as f:
            twitch_data = json.load(f)
        with open(os.path.join(data_dir, 'youtube-' + date + '.json'), encoding = 'utf-8') as f:
            youtube_data = json.load(f)
        
        return {
            'twitch' : twitch_data,
            'youtube' : youtube_data
        }
    except:
        print('no file exists')
        sys.exit(-1)

def merge(parameter_list):
    pass

def save(data, out_dir, filename):
    with open(os.path.join(out_dir, filename), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, separators=(',', ': '), ensure_ascii=False)

def merge_data_into_one(date, data_dir, out_dir):
    data = file_read(data_dir, date)

    twitube_data = {}

    filename = 'twitube-' + date + '.json'
    save(twitube_data, out_dir, filename)
    print('Created twitube data!!')

if __name__ == '__main__':
    base_dir = os.path.dirname(__file__)
    data_dir = '../data'
    date = '181214'
    out_dir = '../data'
    merge_data_into_one(date=date, data_dir=os.path.join(base_dir, data_dir), out_dir=os.path.join(base_dir, out_dir))