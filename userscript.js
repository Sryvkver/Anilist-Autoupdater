// ==UserScript==
// @name         Anilist updater
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?domain=anilist.co
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

const SHOULD_UPDATE_ANILIST = true;

const waitForElement = async (selector, timeout = 1500) => {
    const start = +new Date();
    let ele = document.querySelector(selector);
    while(!(ele = document.querySelector(selector)) && +new Date() - start < timeout){
        await new Promise(res => setTimeout(res, 10));
    }

    return ele;
}

class _Provider {
    hostname = '';

    isSupported = (url) => {
        const urlP = new URL(url);

        return urlP.hostname.replace('www.', '') === this.hostname.replace('www.', '') && this.getId() !== '';
    }

    // Used to add a button on the page, which opens the selection menu.
    addToPage = () => {};

    // Get the idendifier of the anime -> In the case of crunchyroll we use the url path
    // https://www.crunchyroll.com/de/girlfriend-girlfriend -> girlfriend-girlfriend == being the used ID
    getId = () => ''

    getName = () => ''

    getEpisode = () => 0

    getProgress = async () => 1

    startProgressUpdater = () => {
        //setInterval(this._onUpdate, 100);
        this._onUpdate();
    }

    _lastProgress = -1;
    _onUpdate = async() => {
        while(true){
            const progress = await this.getProgress();
    
            if(progress !== this._lastProgress){
                const progressEvent = new CustomEvent('provider-progress', {
                    detail: {
                        progress,
                        forward: progress > this._lastProgress
                    }
                })
    
                window.dispatchEvent(progressEvent);
    
                this._lastProgress = progress;
            }

            await new Promise(res => setTimeout(res, 100));
        }
    }
}
let provider = new _Provider();

class Provider_Crunchyroll extends _Provider {
    hostname = 'crunchyroll.com';

    _createButton = () => {
        const span = document.createElement('span');
        span.classList.add('right');
        span.style.height = '100%';
        span.style.marginRight = '12px';

        const button = document.createElement('button');
        button.style.height = '100%';
        button.style.background = '#FF6188';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '0.25rem';
        button.style.cursor = 'pointer';
        button.textContent = 'Sryvkver';

        button.onclick = () => POPUP_HELPER.openSelection();


        span.appendChild(button);

        return span;
    }

    addToPage = () => {
        waitForElement('.showmedia-submenu')
            .then(ele => {
                if(!ele) throw 'Element not found!';

                const btn = this._createButton();
                ele.appendChild(btn);
            })
    }

    getId = () => {
        //const splitHref = document.location.href.split('/');
        //const episodeIndex = splitHref.findIndex(ele => ele.startsWith('episode'));

        //return splitHref[episodeIndex - 1];

        return document.querySelector('.showmedia-header .text-link *[itemprop=name]').textContent.trim();
    }

    getName = () => {
        return document.querySelector('#showmedia_about_episode_num > .text-link').textContent;
    }

    getEpisode = () => {
        const episodeRegex = /\/episode-(\d+)/gm;
        const matches = episodeRegex.exec(document.location.href);

        if(matches.length > 1) {
            return Number(matches[1]);
        }
        return -1;
    }

    getProgress = async() => {
        let time = await window.eval(
            `(async () => {
                if(!window.VILOS_PLAYERJS) return 0;

                let time = null;
                let start = +new Date();
                VILOS_PLAYERJS.getCurrentTime(cur => time = cur);
                while(time === null && +new Date() - start < 1000){
                    await new Promise(res => setTimeout(res, 10));
                }
            
                return time;
            })()`
        );
        let dura = await window.eval(
            `(async () => {
                if(!window.VILOS_PLAYERJS) return 1000000;

                let dura = null;
                let start = +new Date();
                VILOS_PLAYERJS.getDuration(cur => dura = cur);
                while(dura === null && +new Date() - start < 1000){
                    await new Promise(res => setTimeout(res, 10));
                }
            
                return dura;
            })()`
        );

        // unsafeWindow is bad
        //unsafeWindow.VILOS_PLAYERJS.getCurrentTime(cur => time = cur);
        //unsafeWindow.VILOS_PLAYERJS.getDuration(dur => dura = dur);

        //while(time === null || dura === null){
        //    await new Promise(res => setTimeout(res, 10));
        //}

        return time / dura;
    }
}

class Provider_Test extends _Provider {
    hostname = 'testing';

    isSupported = () => document.location.href === 'https://www.google.com/';

    getId = () => 'test';
    getName = () => 'test';
    getEpisode = () => 1;
    getProgress = async() => +new Date()/1000 % 100;
}

const AVAIABLE_PROVIDERS = [new Provider_Crunchyroll(), new Provider_Test()];



class CAPI {
    API_URI = 'http://127.0.0.1:9999';
    
    getAllRecommended = (hostName, hostId, episode) => {
        return fetch(`${this.API_URI}/getAllIds?host=${hostName}&host_id=${hostId}&episode=${episode}`)        
                .then(resp => resp.json())
                .then(async js => {
                    if(js.length === 0 || js[0].anilist_ids.length === 0) throw 'Nothing found!';

                    for (const anilistIdObject of js[0].anilist_ids) {
                        if(anilistIdObject.episodes === -1){
                            const newEpisodes = await ANILIST_API.getEpisodeCountForAnime(anilistIdObject.id);
                            anilistIdObject.episodes = newEpisodes;
    
                            this._updateRecommendation(anilistIdObject);
                        }
                    }

                    return js[0]
                })
    }

    getBestRecommendation = (hostName, hostId, episode) => {
        return fetch(`${this.API_URI}/getBestId?host=${hostName}&host_id=${hostId}&episode=${episode}`)        
                .then(resp => resp.json())
                .then(async js => {
                    if(js.length == 0 || js[0].anilist_ids.id === undefined || js[0].anilist_ids.id === null) throw 'Nothing found!';

                    if(js[0].anilist_ids.episodes === -1){
                        const newEpisodes = await ANILIST_API.getEpisodeCountForAnime(js[0].anilist_ids.id);
                        js[0].anilist_ids.episodes = newEpisodes;

                        this._updateRecommendation(js[0].anilist_ids);
                    }

                    return js[0]
                })
    }

    likeRecommendation = (recoId) => {
        return fetch(`${this.API_URI}/like?id=${recoId}`)        
                .then(resp => resp.json())
                .then(js => {
                    if(js.length === 0 || js[0].anilist_ids.length === 0) throw 'Nothing found!';

                    return js[0]
                })
    }

    createRecommendation = ({
        hostName,
        hostId,
        anilistId,
        anilistName,
        anilistNameEnglish,
        anilistEpisodes,
        anilistImage,
        from = undefined,
        start = undefined}) => {

        let url = `${this.API_URI}/create?host=${hostName}&host_id=${hostId}`;
        url += `&anilist_id=${anilistId}`;
        url += `&anilist_name=${anilistName}`;
        url += `&anilist_name_english=${anilistNameEnglish}`;
        url += `&anilist_image=${anilistImage}`;
        url += `&episodes=${(anilistEpisodes === null ? -1 : anilistEpisodes)}`;

        url += `${from !== undefined ? '&from=' + from : ''}`;
        url += `${start !== undefined ? '&start=' + start : ''}`;

        return fetch(url)
                .then(resp => resp.json())
                .then(js => {
                    if(js.length === 0 || js[0].anilist_ids.length === 0) throw 'Nothing found!';

                    return js[0]
                })
    }


    _updateRecommendation = async(anilistObj) => {
        return fetch(`${this.API_URI}/update?id=${anilistObj._id}`, {
            method: 'POST',
            headers: {
                "accept": "application/json",
                "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/json",
                "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
              },
            body: JSON.stringify(anilistObj)
        }).then(resp => resp.json());

    }
}
const API = new CAPI();

class CAnilist_API {
    CURRENT_ID = null;
    CURRENT_EPISODE_COUNT = null;
    CURRENT_EXTRAS = {
        from_episode: 0,
        episode_offset: 0
    }

    AUTH_URI = 'https://anilist.co/api/v2/oauth/authorize?client_id=6455&response_type=token';
    API_URI = 'https://graphql.anilist.co';

    _STORAGE_KEY = 'ANILIST_KEY';
    
    IS_AUTHENTICATED = false;

    constructor() {
        this.IS_AUTHENTICATED = GM_getValue(this._STORAGE_KEY, null) !== null;
    }

    auth = async () => {
        if(this.IS_AUTHENTICATED) return true;

        const authWindow = window.open(this.AUTH_URI, '_blank');
        
        while(!authWindow.closed){
            await new Promise(res => setTimeout(res, 100));
        }

        const key = prompt('Please enter your key', '');

        if(key){
            console.log('Setting anilist key!');
            GM_setValue(this._STORAGE_KEY, key);
            return true;
        }

        return false;
    }

    searchResponseToInfoObject = (resp) => {
        const infos = [];
        for (const anilistInfo of resp.data.Page.media) {
            infos.push({
                name: anilistInfo.title.romaji,
                nameEnglish: anilistInfo.title.english || 'Not avaiable',
                image: anilistInfo.coverImage.large,
                episodes: anilistInfo.episodes,
                id: anilistInfo.id
            });
        }
        return infos;
    }

    searchForName = (name) => {
        const query = `
        {
            Page(page: 1, perPage: 10) {
                media(search: "${name}", type: ANIME) {
                  id,
                title {
                  romaji
                  english
                  native
                  userPreferred
                },
                coverImage {
                  extraLarge
                  large
                  medium
                  color
                },
                siteUrl,
                episodes
                }
              }
          }`;



        return fetch(this.API_URI, {
            "headers": {
              "accept": "application/json",
              "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
              "content-type": "application/json",
              "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
              "sec-ch-ua-mobile": "?0",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-site"
            },
            "referrer": "https://anilist.co/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify({
                operationName: null,
                variables: null,
                query
            }),
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
          })
          .then(data => data.json())
          .then(data => this.searchResponseToInfoObject(data))
    }

    //https://anilist.gitbook.io/anilist-apiv2-docs/overview/oauth/implicit-grant
    updateAnime = async (episode, anilist_id = this.CURRENT_ID) => {
        const actualEpisode = episode + this.CURRENT_EXTRAS.episode_offset;
        if(actualEpisode > this.CURRENT_EPISODE_COUNT) return false;

        const query = `
        mutation($mediaId: Int, $progress: Int, $status: MediaListStatus){
            SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress, notes: "Auto updated with Sryvkver"){
              id,
              progress,
              status,
              media {
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
              }
            }
          }`;

        const variables = {
            mediaId: anilist_id,
            progress: actualEpisode,
            status: (actualEpisode === this.CURRENT_EPISODE_COUNT ? 'COMPLETED' : 'CURRENT')
        };
        
        POPUP_HELPER.createAlert(`[${anilist_id}] ${actualEpisode}`);
        console.log(anilist_id, actualEpisode);

        //return true;

        if(!SHOULD_UPDATE_ANILIST)
            return true;

        return fetch(this.API_URI, {
            "headers": {
                "Authorization": "Bearer " + GM_getValue(this._STORAGE_KEY, ''),
                "accept": "application/json",
                "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/json",
                "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
            },
            "referrer": "https://anilist.co/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify({
                operationName: null,
                variables,
                query
            }),
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
        })
            .then(data => data.json())
            .then(data => !!data)
    }

    getEpisodeCountForAnime = async (anilist_id) => {
        const query = `
            {
                Media(id: ${anilist_id}){
                episodes
                }
            }`;

        return fetch(this.API_URI, {
            "headers": {
              "accept": "application/json",
              "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
              "content-type": "application/json",
              "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
              "sec-ch-ua-mobile": "?0",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-site"
            },
            "referrer": "https://anilist.co/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify({
                operationName: null,
                variables: null,
                query
            }),
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
          })
          .then(data => data.json())
          .then(episodeCount => !!episodeCount.data.Media.episodes ? episodeCount.data.Media.episodes : -1)
          .catch((err) => -1);
    }
}
const ANILIST_API = new CAnilist_API();



class CPopup_Helper {
    _alertQueue = [];
    _popupSelector = '#sryvkver-popup';

    _infoIcon = 'https://cdn-icons-png.flaticon.com/512/108/108153.png'
    createPopups = () => {
        this._createSelectionPopup();
    }

    createAlert = (title, image=this._infoIcon) => {
        const lastAlert = this._alertQueue[this._alertQueue.length-1];
        const id = (!!lastAlert ? lastAlert+1 : 1)

        const alertPopup = document.createElement('div');
        alertPopup.setAttribute('style', `
            padding: 6px;
            background: #2D2A2E;
            color: #f2f2f2;
            border-radius: 12px;
            width: max-content;
            display: flex;
            align-items: center;
            gap: 1rem;
            height: 3rem;
            font-size: 1.25rem;
            position: absolute;
            top: calc(16px + (3rem + 12px + 8px) * ${this._alertQueue.length});
            right: 16px;
            z-index: 9999;
            opacity: 0;
            /*pointer-events: none;*/
            transition: opacity 150ms, top 100ms;
        `)
        alertPopup.classList.add('sryvkver-alert');
        alertPopup.setAttribute('data-alert-id', id);

        alertPopup.innerHTML = `
            <img style="height: 3rem;width: 3rem; border-radius: 50%; object-fit:cover;background:white;" src="${image}" alt="">
            <p>${title}</p>`;

        this._alertQueue.push(id)
        document.body.appendChild(alertPopup).style.opacity = 1;
        

        setTimeout(() => this._closeAlert(id), 2000);
    }

    openSelection = () => {
        API.getAllRecommended(provider.hostname, provider.getId(), provider.getEpisode())
            .then(data => {
                console.log(data);
                this._fillSelectionPopup(data.anilist_ids);
            })
            .catch(err => {
                //openAlert('', 'ERROR - ' + err);
                console.log('--------------', err);
                this.createAlert('No saved Anilist ID found!');

                document.querySelector(this._popupSelector + ' .sryvkver-search-input').value = provider.getName();

                return ANILIST_API.searchForName(provider.getName())
                    .then(data => this._fillSelectionPopup(data));
            })
            .finally(() => {
                console.log(document.querySelector(this._popupSelector));
                document.querySelector(this._popupSelector).style.opacity = 1;
                document.querySelector(this._popupSelector).style.pointerEvents = 'all';
            })
    }

//#region Private Methos

    _fillRecommended = () => {
        API.getAllRecommended(provider.hostname, provider.getId(), provider.getEpisode())
            .then(data => {
                console.log(data);
                this._fillSelectionPopup(data.anilist_ids);
            })
            .catch(err => {
                //openAlert('', 'ERROR - ' + err);
                console.log('--------------', err);
                this.createAlert('No saved Anilist ID found!');
            })
    }

    _onSearchKey = (ev) => {
        if(ev.code === 'Enter' || ev.code === 'NumpadEnter')
            this._onSearch();
    }

    _onSearch = () => {
        const searchTerm = document.querySelector(this._popupSelector + ' .sryvkver-search-input').value;

        ANILIST_API.searchForName(searchTerm)
            .then(data => this._fillSelectionPopup(data));
    }

    _onSetAsUpdating = (infos) => {
        console.log(infos);
        this.createAlert('Set anilist ID to: ' + infos.id);
        ANILIST_API.CURRENT_ID = infos.id;
        ANILIST_API.CURRENT_EPISODE_COUNT = infos.episodes;

        if(infos._id){

            API.likeRecommendation(infos._id);
        }else{
            // TODO add from and start popup

            // TODO CHANGE THIS SHIT TO SEPERATE
            const from = provider.getEpisode() - (prompt(`Please enter current episode of season (Selected anime has ${infos.episodes} episodes, found ${provider.getEpisode()})`, (provider.getEpisode() <= infos.episodes || infos.episodes === null || infos.episodes === -1 ?  provider.getEpisode() : 1)) - 1);
            const off = Math.min(from*-1 + 1, 0);

            if(from < 1 || (infos.episodes !== null && infos.episodes !== -1 && from > infos.episodes))
                return POPUP_HELPER.createAlert('Invalid input!');

            ANILIST_API.CURRENT_EXTRAS = {
                from_episode: from,
                episode_offset: off
            }

            API.createRecommendation({
                hostName: provider.hostname,
                hostId: provider.getId(),
                anilistId: infos.id,
                anilistEpisodes: infos.episodes,
                anilistImage: infos.image,
                anilistName: infos.name,
                anilistNameEnglish: infos.nameEnglish,
                from,
                start: off
            })
                .then((data) => console.log(data));
        }

    }

    _createAnimeElement = (index, animeInfo) => {
        return `
        <div class="anime" data-likes="${animeInfo?.rating || 0}">
            <img src="${animeInfo.image}" alt="">
            <div class="info">
                <p><b>Name: </b>${animeInfo.name}</p>
                <p><b>English: </b>${animeInfo.nameEnglish}</p>
                <p><b>Episodes: </b>${animeInfo.episodes}</p>
                <div class="buttons boder-sep">
                    <button onClick="window.open('${animeInfo.siteUrl}', '_blank')">Open Anilist</button>
                    ${animeInfo._id ? `<button data-reco-id="${animeInfo._id}">Like</button>` : ''}
                    <button data-index="${index}">Set as Updating</button>
                </div>
            </div>
        </div>`;
    }

    _fillSelectionPopup = (animeInfos) => {
        document.querySelector(this._popupSelector + ' .anime-list').innerHTML = '';
        
        for (const [index, info] of animeInfos.entries()) {
            info.siteUrl = info.siteUrl ? info.siteUrl : 'https://anilist.co/anime/' + info.id;

            document.querySelector(this._popupSelector + ' .anime-list').innerHTML += this._createAnimeElement(index, info);
        }


        document.querySelectorAll(this._popupSelector + ' *[data-reco-id]').forEach(ele => {
            const id = ele.getAttribute('data-reco-id');

            ele.onclick = () => console.log('------------LIKING:', id, '---------------------------');

            ele.removeAttribute('data-reco-id');
        })

        document.querySelectorAll(this._popupSelector + ' *[data-index]').forEach(ele => {
            const index = Number(ele.getAttribute('data-index'));

            ele.onclick = () => this._onSetAsUpdating(animeInfos[index]);

            ele.removeAttribute('data-index');
        })
    }

    _closeSelectionPopup = () => {
        document.querySelector(this._popupSelector).style.pointerEvents = 'none';
        document.querySelector(this._popupSelector).style.opacity = 0;
    }

    _createSelectionPopup = () => {
        const selectionPopup = document.createElement('div');
        selectionPopup.innerHTML = `
        <div class="sryvkver popup" id="${this._popupSelector.substr(1)}">
            <div class="popup-background sryvkver-popup-close"></div>
            <div class="popup-content">
                <div class="search">
                    <label for=""">Anilist Search-term: </label>
                    <input type="text" style="flex-grow: 1; flex-shrink: 1;" class="sryvkver-search-input">
                    <button style="flex-grow: 1; flex-shrink: 1;" class="sryvkver-search-btn">Search</button>
                    <button style="flex-grow: 1; flex-shrink: 1;" class="sryvkver-show-reco">Show suggestions</button>
                </div>
                <div style="overflow-y: scroll; padding-right: 6px;" class="anime-list">
                </div>
                <button class="sryvkver-popup-close">Close</button>
            </div>
        </div>`;
        
        const selectionCSS = document.createElement('style');
        selectionCSS.innerText = `
        .sryvkver,
            .sryvkver * {
                all: initial;
            }

            .sryvkver * {
                color: inherit;
                pointer-events: inherit;
                -webkit-user-drag: none;
            }

            .sryvkver input,
            .sryvkver button {
                font-size: small;
                padding: 4px;
            }

            .sryvkver input {
                background: #3C383D;
            }

            .sryvkver .boder-sep > *{
                border-right: 1px solid white;
            }

            .sryvkver .boder-sep > *:last-child {
                border: none;
            }

            .sryvkver button {
                cursor: pointer;
                text-align: center;
                background: #3C383D;
            }

            .sryvkver button:hover {
                background: #797979;
            }

            .sryvkver.popup {
                pointer-events: none;
                opacity: 0;
                transition: opacity 150ms;
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .sryvkver .popup-background {
                position: absolute;
                background-color: rgba(0,0,0,.2);
                width: 100%;
                height: 100%;
                cursor: pointer;
            }

            .sryvkver .popup-content {
                display: flex;
                flex-direction: column;
                gap: 18px;
                max-width: 75vw;
                max-height: 50vh;
                background: #2D2A2E;
                color: #f2f2f2;
                padding: 16px;
                border-radius: 12px;
                text-align: center;
                z-index: 10000;
            }

            .sryvkver .search {
                display: flex;
                width: 100%;
                gap: 6px;
            }

            .sryvkver .anime {
                position: relative;
                display: flex;
                height: 7rem;
                gap: 6px;

                margin-bottom: 12px;
            }

            .sryvkver .anime:not([data-likes="0"]):after {
                content: '❤ 'attr(data-likes);
                font-size: .75rem;
                padding: 2px;
                text-align: center;
                position: absolute;
                top: 2px;
                left: 2px;
                background: #2D2A2E;
                border-radius: .95rem;
                height: .95rem;
                min-width: .95rem;
            }

            .sryvkver .anime:last-child {
                margin-bottom: 0;
            }

            .sryvkver .anime .info {
                display: flex;
                flex-direction: column;
                text-align: start;
                gap: 6px;
                width: 100%;
            }

            .sryvkver .anime .info p{
                margin: 0;
            }

            .sryvkver .anime .buttons {
                margin-top: auto;
                display: flex;
            }

            .sryvkver .anime .buttons button {
                flex-basis: 100%;
            }`;

        document.body.appendChild(selectionPopup);
        document.body.appendChild(selectionCSS);


        document.querySelectorAll('.sryvkver-popup-close').forEach(ele => {
            ele.classList.remove('sryvkver-popup-close');
            ele.onclick = () => this._closeSelectionPopup();
        })

        document.querySelector(this._popupSelector + ' .sryvkver-search-input').onkeydown = (ev) => this._onSearchKey(ev);

        document.querySelector(this._popupSelector + ' .sryvkver-search-btn').onclick = () => this._onSearch();

        document.querySelector(this._popupSelector + ' .sryvkver-show-reco').onclick = () => this._fillRecommended();
    }

    _closeAlert = (id) => {
        const alertEle = document.querySelector(`.sryvkver-alert[data-alert-id="${id}"]`);
        alertEle.style.opacity = 0;

        setTimeout(() => {
            alertEle.parentNode.removeChild(alertEle);
    
            const otherAlerts = document.querySelectorAll('.sryvkver-alert');
            for (let index = 0; index < otherAlerts.length; index++) {
                otherAlerts[index].style.top = `calc(16px + (3rem + 12px + 8px) * ${index})`;
            }

            this._alertQueue = this._alertQueue.filter(ele => ele !== id);
        }, 150);

    }

//#endregion

}
const POPUP_HELPER = new CPopup_Helper();

class CStorage_Helper {
    _ANIME_KEY = 'STORE_ANIME'

    getSaved = (host, host_id, episode) => {
        const store = JSON.parse(GM_getValue(_ANIME_KEY, '[]'));

        const animeInfo = store.find(ele => ele.host === host && ele.host_id === host_id);
        animeInfo.anilist_ids = animeInfo.anilist_ids.filter(ele => ele.extras.from_episode <= episode);
        animeInfo.anilist_ids.sort((a,b) => a.extras.from_episode - b.extras.from_episode);
        const info = animeInfo.anilist_ids[0];

        console.log(info);
    }
}
const STORAGE_HELPER = new CStorage_Helper();
let hasUpdated = false;

(() => {
    provider = null;
    if (window != window.top) return;

    for (const prov of AVAIABLE_PROVIDERS) {
        if(prov.isSupported(document.location.href)){
            provider = prov;
            break;
        }
    }

    if(provider === null || document.location.hostname === 'anilist.co') return;
    provider.startProgressUpdater();
    provider.addToPage();

    ANILIST_API.auth()
        .then(isAuthenticated => {
            if(!isAuthenticated) return;

            POPUP_HELPER.createPopups();
        
            API.getBestRecommendation(provider.hostname, provider.getId(), provider.getEpisode())
                .then(data => {
                    console.log('-------------------', data);
                    POPUP_HELPER.createAlert('Found ' + data.anilist_ids.name, data.anilist_ids.image);
                    ANILIST_API.CURRENT_ID = data.anilist_ids.id;
                    ANILIST_API.CURRENT_EXTRAS = data.anilist_ids.extras;
                    ANILIST_API.CURRENT_EPISODE_COUNT = data.episodes;
                })
                .catch(err => {
                    console.error('-------------------', err)
                    POPUP_HELPER.openSelection();
                });
        })


    window.addEventListener('provider-progress', async ({detail}) => {
        if(ANILIST_API.CURRENT_ID !== null && detail.progress > 0.75 && !hasUpdated){
            console.log(detail);
            hasUpdated = true;
            console.log('Okay')
            hasUpdated = await ANILIST_API.updateAnime(provider.getEpisode());
        }
    })


})()