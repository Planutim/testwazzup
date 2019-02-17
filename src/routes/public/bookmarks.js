import { Router } from 'express';
import validate from 'validate.js'
import request from 'request'

import models from '../../models';
import { linkConstraints } from '../../validators/bookmark'
const router = Router();



/**
 * @apiDescription Получение списка закладок  
 */
router.get('/', async (req,res) => {
  let where = {}
  if(req.query.filter && ['createdAt', 'favorites'].includes(req.query.filter)) {

    if(req.query.filter ==='favorites' && req.query.filter_value && ['true', 'false'].includes(req.query.filter_value)){     //filter_value for favorites
      where = {
        ['favorites']: (req.query.filter_value === 'true') ? true : false
      }
    } else if (req.query_filter_from || req.query_filter_to){  // for createdAt
      where = {
        ['createdAt']: {
          $gt: new Date(Date.parse(req.query_filter_from)) || null,
          $lt: new Date(Date.parse(req.query_filter_to)) || null
        }
      }
    }
  }
  var options = {
    where:  where,
    limit: parseInt(req.query.limit,10) || 50,
    offset: parseInt(req.query.offset,10) || 0,
    order: ['createdAt', 'favorites'].includes(req.query.sort_by)
      ? [
          [
            req.query.sort_by,
            ['asc', 'desc'].includes(req.query.sort_dir) ? req.query.sort_dir : 'asc'
          ]
        ]
      : null,
  }

  try {
    var result = await models.bookmark.findAll(options)
    //return data
    res.json({
      length: result.length,
      data: result
    })
  } catch (e){
    res.status(400).json({
      errors: {
        backend: ['Db is down']
      }
    })
  }
})



/**
 * @apiDescription Создание закладки
 */
router.post('/', async (req, res) => {
  const validationResult = validate(req.body, {
    link: linkConstraints
  })

  if(validationResult) { // invalid link
    res.status(400).json({
      errors: {
        code: 'BOOKMARKS_INVALID_LINK',
        description: 'Invalid link'
      }
    });
  } else if((/(yahoo\.com|socket\.io)/.test(req.body.link))) { //blocked domains
    res.status(400).json({
      errors: {
        code: 'BOOKMARKS_BLOCKED_LINK',
        description: `"${req.body.link}" banned`
      }
    })
  }else {
    try {
      var newBookmark = await models.bookmark.create({
        link: req.body.link,
        description: req.body.description,
        favorites: req.body.favorites
      })

      
      res.status(201).json({ //send response
        data: {
          guid: newBookmark.guid,
          createdAt: newBookmark.createdAt
        }
      })
    } catch (e){
      res.status(400).json({
        errors: {
          backend: ["Cant create bookmark"]
        }
      })
    }
  }
})


/**
 * @apiDescription Редактирование закладки 
 */
router.patch('/:guid', async (req, res) => {
  if(req.body.link){ //check link
    const validationResult = validate(req.body, {
      link: linkConstraints
    })
  
    if(validationResult) { // invalid link
      res.status(400).json({
        errors: {
          code: 'BOOKMARKS_INVALID_LINK',
          description: 'Invalid link'
        }
      });
    } else if((/(yahoo\.com|socket\.io)/.test(req.body.link))) { //blocked domains
      res.status(400).json({
        errors: {
          code: 'BOOKMARKS_BLOCKED_LINK',
          description: `"${req.body.link}" banned`
        }
      })
    }
  }

  let updateObject = {}
  let editFields = Object.keys(req.body).filter(field=>['link','description','favorites'].includes(field)) //filter wrong parameters in req.body
  
  editFields.map(field=>{
    if(req.body[field]) // if parameter isnt empty
      updateObject[field] = req.body[field]
  })
  
  try {
    var editBookmark = await models.bookmark.update(
      updateObject,
      {
        where: {
          guid: req.params.guid
        }
      }
    )

    if(editBookmark[0] === 1){ // if result is found
      res.sendStatus(200)
    } else { // if result is none
      res.status(404).json({
        errors: {
          backend: ["ID not found"]
        }
      })
    }
  } catch (error) {
    res.status(400).json({
      errors: {
        backend: ["Wrong parameters"]
      }
    })
  }
})

/**
 * @apiDescription Удаление закладки
 */
router.delete('/:guid', async (req, res) => {
  try {
    let deleteResult = await models.bookmark.destroy({
      where: {
        guid: req.params.guid
      }
    })
    if(deleteResult === 1){
      res.sendStatus(200)
    } else {
      res.status(404).json({
        errors: {
          backend: ["ID not found"]
        }
      })
    }
  } catch (e) {
    res.status(400).json({
      errors: {
        backend: ["Bad request"]
      }
    })
  } 
})

/**
 * @apiDescription Получение информации об указанной закладке
 */
router.get('/:guid', async (req,res) => {

  try {
    var getResult = await models.bookmark.findOne({
      where: {
        guid: req.params.guid
      },

    })
    if(getResult){
      let { link } = getResult
      let apiLink = `https://htmlweb.ru/analiz/api.php?whois&url=${link}&json`
      
      request({
        url: apiLink,
        json: true,
      }, function(error, response, data) {
        if(error) res.sendStatus(400)
        res.json({
          data: {
            WHOIS: data
          }
        })
      })
    } else {
      res.status(404).json({
        errors: {
          backend: ["ID not found"]
        }
      })
    }
  } catch (e){
    res.sendStatus(400)
  }
})

export default router;