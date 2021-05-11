#快速發布資料至github目錄
#run in blog root dir
webURL="davidhsu666.com"
blogDir="."
githubDir="D:/Github/beadx6ggwp.github.io"
blogSource="blogSource"
docs="docs"

hugo
#delete old data
rm -rf ${githubDir}/${blogSource}/*
rm -rf ${githubDir}/${docs}/*

mv ${blogDir}/public/* ${githubDir}/docs
cp -rf ${blogDir}/* ${githubDir}/blogSource
#add CNAME
echo ${webURL} >> ${githubDir}/${docs}/CNAME

# ------push github use ssh-----
# 記得要先將remote從https換成ssh
# git remote set-url origin git@github.com:beadx6ggwp/beadx6ggwp.github.io.git

cd ${githubDir}
git status
git add .
git log
git commit -m "upload blog"
git push -u origin main