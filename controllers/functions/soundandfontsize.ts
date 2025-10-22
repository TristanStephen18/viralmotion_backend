export function soundurlReplacer(url :string){
    const newurl = url.replaceAll('/soundeffects/texttyping', "audios");

    return newurl;
}

export function soundurlReplacerFaketext(url :string){
    const newurl = url.replaceAll("/soundeffects/bgmusic", "bgmusic");

    return newurl;
}


export function fontSizeCalc(fontsize: number){
    return fontsize * 4;
}

export function splitScreenVideoUploadedUrlReplacer(url: string){
    return url.replaceAll("/defaultvideos/useruploads", "videos");
}

export function splitScreenVideoSelectedUrlReplacer(url: string): string {
  return url.replace(/\/defaultvideos\/[^/]+/, "videos");
}

export function BgVideoUrlReplacer(url: string): string {
  return url.replace(/\/defaultvideos\/[^/]+/, "videos");
}
