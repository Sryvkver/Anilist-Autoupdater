import { AnilistModel, IAnilist } from "../models/Anilist"

/*

export const getBestAnilistId = (host: string, host_id: string, episode: number) => {
    return AnilistModel.aggregate([
        {
          '$match': {
            '$and': [
              {
                'hostname': host
              }, {
                'host_id': host_id
              }
            ]
          }
        }, {
          '$unwind': {
            'path': '$anilist_ids'
          }
        }, {
          '$group': {
            '_id': '$_id', 
            'hostname': {
              '$first': '$hostname'
            }, 
            'host_id': {
              '$first': '$host_id'
            }, 
            'anilist_ids': {
              '$push': '$anilist_ids'
            }, 
            'max_from': {
              '$max': {
                '$cond': [
                  {
                    '$lte': [
                      '$anilist_ids.extras.from_episode', episode
                    ]
                  }, '$anilist_ids.extras.from_episode', -1
                ]
              }
            }
          }
        }, {
          '$project': {
            '_id': 1, 
            'hostname': 1, 
            'host_id': 1, 
            'anilist_ids': {
              '$setDifference': [
                {
                  '$map': {
                    'input': '$anilist_ids', 
                    'as': 'list', 
                    'in': {
                      '$cond': [
                        {
                          '$eq': [
                            '$max_from', '$$list.extras.from_episode'
                          ]
                        }, '$$list', false
                      ]
                    }
                  }
                }, [
                  false
                ]
              ]
            }
          }
        }, {
          '$unwind': {
            'path': '$anilist_ids'
          }
        }, {
          '$sort': {
            'anilist_ids.accepted': -1, 
            'anilist_ids.rating': -1
          }
        }, {
          '$limit': 1
        }
      ])
}

*/

export const getBestAnilistId = (host: string, host_id: string, episode: number) => {
  return AnilistModel.aggregate([
      {
        '$match': {
          '$and': [
            {
              'hostname': host
            }, {
              'host_id': host_id
            }
          ]
        }
      }, {
        '$unwind': {
          'path': '$anilist_ids'
        }
      }, {
        '$group': {
          '_id': '$_id', 
          'hostname': {
            '$first': '$hostname'
          }, 
          'host_id': {
            '$first': '$host_id'
          }, 
          'anilist_ids': {
            '$push': '$anilist_ids'
          }, 
          'max_from': {
            '$max': {
              '$cond': [
                {
                  '$lte': [
                    '$anilist_ids.extras.from_episode', episode
                  ]
                }, '$anilist_ids.extras.from_episode', -1
              ]
            }
          }
        }
      }, {
        '$project': {
          '_id': 1, 
          'hostname': 1, 
          'host_id': 1, 
          'anilist_ids': {
            '$setDifference': [
              {
                '$map': {
                  'input': '$anilist_ids', 
                  'as': 'list', 
                  'in': {
                    '$cond': [
                      {
                        '$and': [
                          {
                            '$eq': [
                              '$max_from', '$$list.extras.from_episode'
                            ]
                          }, {
                            '$or': [
                              {
                                '$lte': [
                                  {
                                    '$add': [
                                      '$$list.extras.episode_offset', episode
                                    ]
                                  }, '$$list.episodes'
                                ]
                              }, {
                                '$eq': [
                                  '$$list.episodes', -1
                                ]
                              }
                            ]
                          }
                        ]
                      }, '$$list', false
                    ]
                  }
                }
              }, [
                false
              ]
            ]
          }
        }
      }, {
        '$unwind': {
          'path': '$anilist_ids'
        }
      }, {
        '$sort': {
          'anilist_ids.accepted': -1, 
          'anilist_ids.rating': -1
        }
      }, {
        '$limit': 1
      }
    ])
}

/*
export const getAllIdsForAnime = (host: string, host_id: string, episode: number) => {
    return AnilistModel.aggregate([
        {
          '$match': {
            '$and': [
              {
                'hostname': host
              }, {
                'host_id': host_id
              }
            ]
          }
        }, {
          '$unwind': {
            'path': '$anilist_ids'
          }
        }, {
          '$group': {
            '_id': '$_id', 
            'hostname': {
              '$first': '$hostname'
            }, 
            'host_id': {
              '$first': '$host_id'
            }, 
            'anilist_ids': {
              '$push': '$anilist_ids'
            }, 
            'max_from': {
              '$max': {
                '$cond': [
                  {
                    '$lte': [
                      '$anilist_ids.extras.from_episode', episode
                    ]
                  }, '$anilist_ids.extras.from_episode', -1
                ]
              }
            }
          }
        }, {
          '$project': {
            '_id': 1, 
            'hostname': 1, 
            'host_id': 1, 
            'anilist_ids': {
              '$setDifference': [
                {
                  '$map': {
                    'input': '$anilist_ids', 
                    'as': 'list', 
                    'in': {
                      '$cond': [
                        {
                          '$eq': [
                            '$max_from', '$$list.extras.from_episode'
                          ]
                        }, '$$list', false
                      ]
                    }
                  }
                }, [
                  false
                ]
              ]
            }
          }
        }
      ])
}
*/

export const getAllIdsForAnime = (host: string, host_id: string, episode: number) => {
  return AnilistModel.aggregate([
    {
      '$match': {
        '$and': [
          {
            'hostname': host
          }, {
            'host_id': host_id
          }
        ]
      }
    }, {
      '$unwind': {
        'path': '$anilist_ids'
      }
    }, {
      '$group': {
        '_id': '$_id', 
        'hostname': {
          '$first': '$hostname'
        }, 
        'host_id': {
          '$first': '$host_id'
        }, 
        'anilist_ids': {
          '$push': '$anilist_ids'
        }, 
        'max_from': {
          '$max': {
            '$cond': [
              {
                '$lte': [
                  '$anilist_ids.extras.from_episode', episode
                ]
              }, '$anilist_ids.extras.from_episode', -1
            ]
          }
        }
      }
    }, {
      '$project': {
        '_id': 1, 
        'hostname': 1, 
        'host_id': 1, 
        'anilist_ids': {
          '$setDifference': [
            {
              '$map': {
                'input': '$anilist_ids', 
                'as': 'list', 
                'in': {
                  '$cond': [
                    {
                      '$and': [
                        {
                          '$eq': [
                            '$max_from', '$$list.extras.from_episode'
                          ]
                        }, {
                          '$or': [
                            {
                              '$lte': [
                                {
                                  '$add': [
                                    '$$list.extras.episode_offset', episode
                                  ]
                                }, '$$list.episodes'
                              ]
                            }, {
                              '$eq': [
                                '$$list.episodes', -1
                              ]
                            }
                          ]
                        }
                      ]
                    }, '$$list', false
                  ]
                }
              }
            }, [
              false
            ]
          ]
        }
      }
    }
  ])
}

export const addNewAnime = async (host: string, host_id: string, episodes: number, anilistData: {anilist_id: number, anilist_name: string, anilist_name_english: string, anilist_image: string}, extras: {from_episode: number, episode_offset: number}) => {
    const oldAnime = await AnilistModel.find({
        hostname: host,
        host_id
    }).exec();

    let anime: IAnilist;

    if(oldAnime.length > 0){
        anime = oldAnime[0];

        let anilistIndex = anime.anilist_ids.findIndex(ele => ele.id === anilistData.anilist_id && ele.extras.from_episode === extras.from_episode && ele.extras.episode_offset === extras.episode_offset);

        if(anilistIndex === -1){
            anilistIndex = anime.anilist_ids.push({
                accepted: false,
                id: anilistData.anilist_id,
                image: anilistData.anilist_image,
                name: anilistData.anilist_name,
                name_english: anilistData.anilist_name_english,
                episodes,
                rating: 0,
                extras
            }) - 1;
        }

        anime.anilist_ids[anilistIndex].rating = +anime.anilist_ids[anilistIndex].rating + 1;
    }else{
        anime = new AnilistModel({
            hostname: host,
            host_id: host_id,
            anilist_ids: [{
                accepted: false,
                id: anilistData.anilist_id,
                image: anilistData.anilist_image,
                name: anilistData.anilist_name,
                name_english: anilistData.anilist_name_english,
                episodes,
                rating: 1,
                extras
            }]
        });
    }

    return new Promise((res, rej) => {
        anime.save(err => {
            if(err) return rej(err);

            return res(anime);
        })
    })
}

export const likeAnime = async (id: string) => {
    const anime = await AnilistModel.find({
        "anilist_ids._id": id
    }).exec();

    if(anime.length > 0) {
        const idIndex = anime[0].anilist_ids.findIndex(ele => ele._id?.toHexString() === id);

        if(idIndex > -1){
            anime[0].anilist_ids[idIndex].rating = +anime[0].anilist_ids[idIndex].rating + 1;
    
            return anime[0].save();
        }
    }

    return {err: 'Could not find entry with id: ' + id};
}

export const updateAnime = async (id: string, newObj: any) => {
  const anime = await AnilistModel.findOne({
    "anilist_ids._id": id
  });

  if (anime) {
    const idIndex = anime.anilist_ids.findIndex(ele => ele._id?.toHexString() === id);

    if (idIndex > -1) {
      const newAnilistObj = {...anime.anilist_ids[idIndex]};
      console.log('-------------')
      console.log(newAnilistObj)
      console.log('-------------')
      console.log(newObj)
      console.log('-------------')

      Object.assign(newAnilistObj, newObj);

      anime.anilist_ids[idIndex] = newAnilistObj;

      return anime.save();
    }
  }

  return { err: 'Could not find entry with id: ' + id };
}