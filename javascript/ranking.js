function getRank(obj_arr, key) {
    let ranking = {}
    if (key != 'average_viewer') {
        obj_arr.sort((a, b) => {
                        return b[key] - a[key]
                    }).forEach((element, i) => {
                        ranking[element.id] = {
                            'rank' : i,
                            'score' : element[key]
                        }
                    });
    } 
    else {
        obj_arr.sort((a, b) => {
            return b[key]['viewer'] - a[key]['viewer']
        }).forEach((element, i) => {
            ranking[element.id] = {
                'rank' : i,
                'score' : element[key]['viewer']
            }
        });
    }
    return ranking
}

function getRankMap(data, target_key = []) {
    let rankMap = {}
    target_key.forEach((key) => {
        rankMap[key] = getRank(data, key)
    })
    return rankMap
}