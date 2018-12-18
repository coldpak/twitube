from twitch.converter import TwitchConvert
from youtube.youtube_info_convert import YoutubeConvert

import os

if __name__ == '__main__' :
    base_dir = os.path.dirname(__file__)
    date = '181216'
    TwitchConvert(date, os.path.join(base_dir, '../raw_data/twitch_data'), os.path.join(base_dir, '../data'))
    YoutubeConvert(date, os.path.join(base_dir, '../raw_data/youtube_data'), os.path.join(base_dir, '../data'))