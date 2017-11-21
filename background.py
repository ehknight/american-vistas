from pylab import *
from bs4 import BeautifulSoup
import requests
import re
import urllib
import os
import http.cookiejar as cookielib
import json
from tqdm import tqdm
from multiprocessing import Pool
from functools import partial, lru_cache
import photomosaic as pm
from PIL import Image
import glob
from lxml import html
import re
from tqdm import tqdm


# Analyze the collection (the "pool") of images.
pm.set_options(flickr_api_key='2a024a42327979b79c1cefca4967b2c6')

# modified from https://stackoverflow.com/a/28487500

header = {'User-Agent':"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36"}
save_dir = "images/"

def get_soup(url,header):
    return BeautifulSoup(urllib.request.urlopen(urllib.request.Request(url,headers=header)),'html.parser')

@lru_cache()
def get_image_links(query, pages=1):
    image_type="ActiOn"
    query = query.split()
    query ='+'.join(query)
    for start in range(pages):
        url = "https://www.google.com/search?q="+query+"&source=lnms&tbm=isch&start="+str(start*100)
        print(url)
        #add the directory for your image here
        soup = get_soup(url,header)

        image_links = []

        for a in soup.find_all("div",{"class":"rg_meta"}):
            link, img_type =json.loads(a.text)["ou"]  ,json.loads(a.text)["ity"]
            image_links.append((link, img_type))

    return image_links

def download_image(args, query):
    i, (img, image_type) = args
    print("Now downloading {}".format(img))
    try:
        req = urllib.request.Request(img, headers=header)
        raw_img = urllib.request.urlopen(req).read()

        if len(image_type)==0:
            f = open(os.path.join(save_dir, query, query + "_"+ str(i)+".jpg"), 'wb')
        else :
            f = open(os.path.join(save_dir, query, query + "_"+ str(i)+"."+image_type), 'wb')

        f.write(raw_img)
        f.close()
    except Exception as e:
        print("could not load : "+img)
        print(e)

def download_images(query, pages=1):
    links = get_image_links(query, pages)
    pool = Pool(10)
    download_image_ = partial(download_image, query=query)
    pool.map(download_image_, enumerate(links))

import random
import flickr_api
from importlib import reload
from time import sleep
reload(flickr_api)

flickr_api.set_keys('2a024a42327979b79c1cefca4967b2c6', '20b52a44d59a64ef')

words = ['everyday', 'nature', 'life', 'poetry', 'light', 'heart', 'art']

def get_random_flickr_users(n=10):
    word = "{} {}".format(random.choice(words), random.choice(words))
    print(word)
    w = flickr_api.Walker(flickr_api.Photo.search, limit=n, tags=word)
    owners = list(set([photo.owner for photo in w]))[:n]
    print(len(owners))
    # if len(owners) < n:
    #     owners.extend(get_random_flickr_users())
    print(owners)
    return owners

def get_username(user):
    id_ = user.id
    url = "https://www.flickr.com/photos/"+id_
    page = urllib.request.urlopen(url).read()
    soup = BeautifulSoup(str(page), 'html.parser')
    selected_html = str(soup.find("p", {"class": "subtitle no-shrink truncate"}))
    try:
        return re.findall(r"\>(.+)\<", selected_html)[0]
    except IndexError:
        print("error finding username") 
        print(url)
        return id_

def download_random_user_photos():
    users = get_random_flickr_users()
    usernames = '\n'.join(map(get_username, users))
    open("people.txt", 'w').writelines(usernames)

    for n, user in tqdm(enumerate(users)):
        photos = user.getPublicPhotos()
        # pool = Pool(10)
        for i, x in tqdm(enumerate(photos)):
             x.save('images/'+str(n)+'_'+str(i)+'.jpg', size_label='Small')

    return

def make_mosaic():
    image = Image.open(random.choice(glob.glob('ref_images/*')))
    pool = pm.make_pool('images/'+'*.jpg')
    mos = pm.basic_mosaic(image, pool, (40, 40))
    imsave('static/mosaic.png', mos)  

def main():
    download_random_user_photos()
    make_mosaic()

if __name__ == '__main__':
    while True:
        main()