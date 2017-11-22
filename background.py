from bs4 import BeautifulSoup
import requests
import re
import urllib.request, urllib.parse, urllib.error
import os
import http.cookiejar as cookielib
import json
from tqdm import tqdm
from functools import partial, lru_cache
import photomosaic as pm
from pathos.multiprocessing import ProcessingPool as Pool
from PIL import Image
import glob
from lxml import html
import re
from tqdm import tqdm
from skimage.io import imsave
import random
import flickr_api
from importlib import reload
from time import sleep
import imp
imp.reload(flickr_api)


# Analyze the collection (the "pool") of images.
public = '13c7524e2634bd8db28e8730f69a5146'
secret = 'de183f2f33150a00'
pm.set_options(flickr_api_key=public)
flickr_api.set_keys(public, secret)

# pm.set_options(flickr_api_key='2a024a42327979b79c1cefca4967b2c6')
# flickr_api.set_keys('2a024a42327979b79c1cefca4967b2c6', '20b52a44d59a64ef')

# modified from https://stackoverflow.com/a/28487500

header = {'User-Agent':"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36"}
save_dir = "images/"
lmap = lambda x, y: list(map(x, y))

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
    print(("Now downloading {}".format(img)))
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
        print(("could not load : "+img))
        print(e)

def download_images(query, pages=1):
    links = get_image_links(query, pages)
    pool = Pool(10)
    download_image_ = partial(download_image, query=query)
    pool.map(download_image_, enumerate(links))



words = ['everyday', 'nature', 'life', 'poetry', 'light', 'art', 'city']

def get_random_flickr_users(n=10, n_iters_left=5):
    word = "{} {}".format(random.choice(words), random.choice(words))
    print((word, n))
    w = flickr_api.Walker(flickr_api.Photo.search, limit=n, tags=word)
    print("created walker")
    try:
        owners = [photo.owner for photo in w]
        owner_usernames = [owner.id for owner in owners]
        cur_owner_usernames = []
        unique_owners = []
        for owner, username in zip(owners, owner_usernames):
            if username not in cur_owner_usernames:
                print("added {} to unique owners".format(owner.username))
                unique_owners.append(owner)
                cur_owner_usernames.append(username)
            else:
                pass
        owners = unique_owners
    except Exception as e:
        print(e)
        owners = []
    print((len(owners)))
    if len(owners) < n-2 and n_iters_left > 0:
        owners.extend(get_random_flickr_users(n-len(owners), n_iters_left-1))
    print(owners)
    return owners[:n]

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
    print("beginning to get random flickr users")
    users = get_random_flickr_users()
    print("finished getting")
    print(("# of users {}".format(users)))
    print("\n\n")
    usernames = '\n'.join([u.username for u in users])
    # usernames = '\n'.join(map(get_username, users))
    truc_usernames = []
    for username in usernames:
        if len(username) > 8:
            truc_usernames.append(username[:6]+'...')
        else:
            truc_usernames.append(username)


    open("people.txt", 'w').writelines(truc_usernames)
    files = glob.glob('images/*')
    for f in files:
        os.remove(f)

    for n, user in tqdm(enumerate(users)):
        photos = user.getPublicPhotos()[:100]
        pool = Pool(10)
        print("beginning download")
        try:
            lmap(lambda x: x[1].save('images/'+str(n)+'_'+str(x[0])+'.jpg', size_label='Small'),
                    enumerate(photos))
        except Exception as e:
            print("Error in downloading")
            print(e)
            
        print("done")

    return

def make_mosaic():
    img_path = random.choice(glob.glob('ref_images/*'))
    open("cur_ref_img_path.txt", "w").write(img_path)
    image = Image.open(img_path)
    pool = pm.make_pool('images/'+'*.jpg')
    mos = pm.basic_mosaic(image, pool, (50, 50))
    print("vvvvv")
    print(img_path)
    imsave('static/mosaic.png', mos)

def main():
    try:
        download_random_user_photos()
        print("FINISHED DOWNLOADING -- MAKING MOSAIC")
        print("\n\n\n")
        make_mosaic()
        print("MADE MOSAIC")
    except IndexError:
        pass

if __name__ == '__main__':
    while True:
        main()
