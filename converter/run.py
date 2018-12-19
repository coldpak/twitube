from twitch.converter import TwitchConvert
from youtube.youtube_info_convert import YoutubeConvert

import os
import sys

if __name__ == '__main__' :
    base_dir = os.path.dirname(__file__)
    if len(sys.argv) < 2 or len(sys.argv[1]) != 6 :
        date = '181217'
    else :
        date = sys.argv[1]
        print(date)

    TwitchConvert(date, os.path.join(base_dir, '../raw_data/twitch_data'), os.path.join(base_dir, '../data'))
    YoutubeConvert(date, os.path.join(base_dir, '../raw_data/youtube_data'), os.path.join(base_dir, '../data'))