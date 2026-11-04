import numpy as np, collections, subprocess
W,H=1080,960
subprocess.run("ffmpeg -v error -y -i out_download -vf fps=30,scale=1080:960 -f rawvideo -pix_fmt gray frames.raw && ffmpeg -v error -y -i out_download -ac 1 -ar 8000 -f s16le a.raw",shell=True,check=True)
a=np.fromfile('frames.raw',dtype=np.uint8); n=len(a)//(W*H); a=a[:n*W*H].reshape(n,H,W)
L=a[:,8:14,250:290].mean(axis=(1,2)); R=a[:,8:14,790:830].mean(axis=(1,2))
on=lambda x: np.where((x[1:]>150)&(x[:-1]<=150))[0]+1
lo,ro=on(L),on(R)
print('L-R frame offsets:',dict(collections.Counter(int(ro[np.argmin(abs(ro-i))]-i) for i in lo)))
x=np.fromfile('a.raw',dtype=np.int16).astype(float); hop=40
e=np.array([np.sum(x[i:i+hop]**2) for i in range(0,len(x)-hop,hop)]); sm=np.convolve(e,np.ones(4)/4,'same'); thr=np.percentile(sm,90)
ao=np.where((sm[1:]>thr)&(sm[:-1]<=thr))[0]*hop/8000; d=[ao[np.argmin(abs(ao-t))]-t for t in ro/30 if abs(ao[np.argmin(abs(ao-t))]-t)<0.2]
print('audio minus video ms: median %.0f'%(np.median(d)*1000))
