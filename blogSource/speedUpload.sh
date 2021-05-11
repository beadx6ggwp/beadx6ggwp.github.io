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