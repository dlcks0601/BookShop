const conn = require('../mariadb'); // db 모듈
const { StatusCodes } = require('http-status-codes'); // status code 모듈
const ensureAuthorization = require('../auth');
const jwt = require('jsonwebtoken');

const allBooks = (req, res) => {
  let { category_id, news, limit = 10, currentPage = 1 } = req.query;

  // offset 계산
  let offset = parseInt(limit) * (parseInt(currentPage) - 1);
  if (isNaN(offset)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Invalid pagination parameters',
    });
  }

  let sql =
    'SELECT SQL_CALC_FOUND_ROWS *, (SELECT count(*) FROM likes WHERE books.id = liked_book_id) AS likes FROM books';
  let values = [];

  if (category_id && news) {
    sql +=
      ' WHERE category_id = ? AND pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()';
    values = [category_id];
  } else if (category_id) {
    sql += ' WHERE category_id = ?';
    values = [category_id];
  } else if (news) {
    sql +=
      ' WHERE pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()';
  }

  sql += ` LIMIT ? OFFSET ?`;
  values.push(parseInt(limit), offset);

  // 첫 번째 쿼리
  conn.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Database query error' });
    }

    if (results && results.length) {
      results.map(function (result) {
        result.pubDate = result.pub_date;
        delete result.pub_Date;
      });

      let allBooksRes = { books: results };

      // 두 번째 쿼리
      const countSql = 'SELECT found_rows()';
      conn.query(countSql, (err, countResults) => {
        if (err) {
          console.log(err);
          return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ message: 'Count query error' });
        }

        let pagination = {};
        pagination.currentPage = parseInt(currentPage);
        pagination.totalCount = countResults[0]['found_rows()'];

        allBooksRes.pagination = pagination;

        return res.status(StatusCodes.OK).json(allBooksRes);
      });
    } else {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'No books found' });
    }
  });
};

const bookDetail = (req, res) => {
  // 로그인 상태가 아니면 => liked 제거
  // 로그인 상태면 => liked 추가

  let authorization = ensureAuthorization(req, res);

  if (authorization instanceof jwt.TokenExpiredError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: '로그인 세션이 만료 되었습니다. 다시 로그인 하세요.',
    });
  } else if (authorization instanceof jwt.JsonWebTokenError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: '잘못된 토큰입니다.',
    });
  } else if (authorization instanceof ReferenceError) {
    let book_id = req.params.id;

    let sql = `SELECT *,
                        (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes
                        FROM books 
                        LEFT JOIN category
                        ON books.category_id = category.category_id
                        WHERE books.id = ?;`;
    let values = [book_id];
    conn.query(sql, values, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.BAD_REQUEST).end();
      }

      if (results[0]) return res.status(StatusCodes.OK).json(results[0]);
      else return res.status(StatusCodes.NOT_FOUND).end();
    });
  } else {
    let book_id = req.params.id;

    let sql = `SELECT *,
                        (SELECT count(*) FROM likes WHERE liked_book_id=books.id) AS likes,
                        (SELECT EXISTS (SELECT * FROM likes WHERE user_id=? AND liked_book_id=?)) AS liked
                    FROM books 
                    LEFT JOIN category
                    ON books.category_id = category.category_id
                    WHERE books.id = ?;`;
    let values = [authorization.id, book_id, book_id];
    conn.query(sql, values, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.BAD_REQUEST).end();
      }

      if (results[0]) return res.status(StatusCodes.OK).json(results[0]);
      else return res.status(StatusCodes.NOT_FOUND).end();
    });
  }
};

module.exports = {
  allBooks,
  bookDetail,
};
