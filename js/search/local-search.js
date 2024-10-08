$(function () {
  var loadFlag = false
  $('a.social-icon.search').on('click', function () {
    $('body').css('width', '100%')
    $('body').css('overflow', 'hidden')
    $('.search-dialog').velocity('stop')
      .velocity('transition.expandIn', {
        duration: 300,
        complete: function () {
          $('#local-search-input input').focus()
        }
      })
    $('.search-mask').velocity('stop')
      .velocity('transition.fadeIn', {
        duration: 300
      })
    if (!loadFlag) {
      search(GLOBAL_CONFIG.localSearch.path)
      loadFlag = true
    }

    // shortcut: ESC
    document.addEventListener('keydown', function f(event) {
      if (event.code === 'Escape') {
        closeSearch()
        document.removeEventListener('keydown', f)
      }
    })
  })

  var closeSearch = function () {
    $('body').css('overflow', 'auto')
    $('.search-dialog').velocity('stop')
      .velocity('transition.expandOut', {
        duration: 300
      })
    $('.search-mask').velocity('stop')
      .velocity('transition.fadeOut', {
        duration: 300
      })
  }
  $('.search-mask, .search-close-button').on('click', closeSearch)

  function search(path) {
    $.ajax({
      url: GLOBAL_CONFIG.root + path,
      dataType: 'xml',
      success: function (xmlResponse) {
        // get the contents from search data
        var datas = $('entry', xmlResponse).map(function () {
          return {
            title: $('title', this).text(),
            content: $('content', this).text(),
            url: $('url', this).text()
          }
        }).get()
        var $input = $('#local-search-input input')[0]
        var $resultContent = $('#local-hits')[0]
        $input.addEventListener('input', function () {
          var str = '<div class="search-result-list">'
          var keywords = this.value.trim().toLowerCase().split(/[\s]+/)
          $resultContent.innerHTML = ''
          if (this.value.trim().length <= 0) {
            $('.local-search-stats__hr').hide()
            return
          }
          var count = 0
          // perform local searching
          datas.forEach(function (data) {
            var isMatch = true
            var dataTitle = data.title.trim().toLowerCase()
            var dataContent = data.content.trim().replace(/<[^>]+>/g, '').toLowerCase()
            var dataUrl = data.url
            var indexTitle = -1
            var indexContent = -1
            var firstOccur = -1
            // only match artiles with not empty titles and contents
            if (dataTitle !== '' && dataContent !== '') {
              keywords.forEach(function (keyword, i) {
                indexTitle = dataTitle.indexOf(keyword)
                indexContent = dataContent.indexOf(keyword)
                if (indexTitle < 0 && indexContent < 0) {
                  isMatch = false
                } else {
                  if (indexContent < 0) {
                    indexContent = 0
                  }
                  if (i === 0) {
                    firstOccur = indexContent
                  }
                }
              })
            } else {
              isMatch = false
            }
            // show search results
            if (isMatch) {
              const content = data.content.trim().replace(/<[^>]+>/g, '')
              if (firstOccur >= 0) {
                // cut out 130 characters
                let start = firstOccur - 30
                let end = firstOccur + 100

                if (start < 0) {
                  start = 0
                }

                if (start === 0) {
                  end = 100
                }

                if (end > content.length) {
                  end = content.length
                }

                let matchContent = content.substring(start, end)

                // highlight all keywords
                keywords.forEach(function (keyword) {
                  const regS = new RegExp(keyword, 'gi')
                  matchContent = matchContent.replace(regS, '<span class="search-keyword">' + keyword + '</span>')
                  dataTitle = dataTitle.replace(regS, '<span class="search-keyword">' + keyword + '</span>')
                })

                str += '<div class="local-search__hit-item"><a href="' + dataUrl + '" class="search-result-title">' + dataTitle + '</a>'
                count += 1

                if (dataContent !== '') {
                  str += '<p class="search-result">...' + matchContent + '...</p>'
                }
              }
              str += '</div>'
              $('.local-search-stats__hr').show()
            }
          })
          if (count === 0) {
            str += '<div id="local-search__hits-empty">' + GLOBAL_CONFIG.localSearch.languages.hits_empty.replace(/\$\{query}/, this.value.trim()) +
              '</div>'
          }
          str += '</div>'
          $resultContent.innerHTML = str
        })
      }
    })
  }
})
