twitchKeyMap = {
    '매도우이헌터' : '메도우이헌터',
    '김재원' : '김재원_',
    '매드라이프' : '매드라이프_',
    '카라멜' : '카라멜_',
    '김뚜띠' : '김뚜띠_',
    '동수칸' : '한동숙'    
}
def keyMap(youtube_id) :
    if youtube_id in twitchKeyMap :
        return twitchKeyMap[youtube_id]
    else :
        return youtube_id
