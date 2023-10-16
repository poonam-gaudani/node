const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    //TODO: Implement this API
    const { query: { page = 1, limit = 10 } } = req;
    const totalDocs = await User.count();
    
    const currentPage = +page;
    const totalPages = totalDocs != 0 ? Math.ceil(totalDocs / +limit) : 0;
    const offset = (currentPage ? +currentPage - 1 : 0) * +limit;
    
    const userDetails = await User.aggregate([
      {
        $skip: offset
      },
      {
        $limit: +limit
      },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "userId",
          as: "Posts"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          posts: { $size: "$Posts" }  // Count the Posts documents for each user
        }
      }
    ]);

    const result = {
      users: userDetails,
      pagination: {
        totalDocs,
        limit: +limit, 
        page: currentPage, totalPages, 
        pagingCounter: currentPage > 1  ? offset+1 : 1,
        hasPrevPage: (currentPage > 1 && totalPages > 1 && totalDocs > 1) ? true: false,
        hasNextPage: (currentPage < totalPages && totalPages > 1) ? true: false,
        prevPage: totalDocs <= 0 || currentPage <= 1 ? null : currentPage - 1,
        nextPage: currentPage >= totalPages ? null : currentPage + 1
      }
    }

    res.status(200).json({ data: result });
  } catch (error) { 
    res.send({ error: error.message });
  }
};
