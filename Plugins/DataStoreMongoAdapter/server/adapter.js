import PenPal from "meteor/penpal";
import { Mongo } from "meteor/mongo";
import { Random } from "meteor/random";
import { check, Match } from "meteor/check";

const MongoAdapter = {};
MongoAdapter.MongoCollections = {};

// -----------------------------------------------------------------------
// MongoAdapter convenience functions

const collection_name = (plugin_name, store_name) =>
  `${plugin_name}.${store_name}`;

const get_collection = (plugin_name, store_name) =>
  MongoAdapter.MongoCollections[collection_name(plugin_name, store_name)];

const normalize_data = ({ id = null, ...rest } = {}) => {
  return { ...(id !== null && { _id: id }), ...rest };
};

const normalize_result = ({ _id = null, ...rest } = {}) => {
  return { ...(_id !== null && { id: String(_id) }), ...rest };
};

const check_options = (options) => {
  const { first, after, last, before, pageSize, pageNumber, sort } = options;
  check(first, Match.Maybe(Number));
  check(after, Match.Maybe(String));
  check(last, Match.Maybe(Number));
  check(before, Match.Maybe(String));
  check(pageSize, Match.Maybe(Number));
  check(pageNumber, Match.Maybe(Number));
  check(sort, Match.Maybe(Match.Where((x) => x === 1 || x === -1)));
};

// -----------------------------------------------------------------------
// MongoAdapter creation/deletion functions

MongoAdapter.CreateStore = async (plugin_name, store_name) => {
  return (MongoAdapter.MongoCollections[
    collection_name(plugin_name, store_name)
  ] = new Mongo.Collection(collection_name(plugin_name, store_name)));
};

MongoAdapter.DeleteStore = async (plugin_name, store_name) => {
  return await get_collection(plugin_name, store_name).rawCollection().drop();
};

// -----------------------------------------------------------------------
// MongoAdapter operations

MongoAdapter.fetch = async (
  plugin_name,
  store_name,
  selector,
  options = {}
) => {
  check_options(options);
  const {
    first,
    after,
    last,
    before,
    pageSize,
    pageNumber,
    sort = 1
  } = options;

  let cursor = get_collection(plugin_name, store_name).rawCollection();

  if (first !== undefined) {
    let _selector = normalize_data(selector);

    if (after !== undefined) {
      _selector = { $and: [{ _id: { $gt: after } }, _selector] };
    }

    cursor = cursor.find(_selector).sort({ _id: sort }).limit(first);
  } else if (last !== undefined) {
    let _selector = normalize_data(selector);

    if (before !== undefined) {
      _selector = { $and: [{ _id: { $lt: before } }, _selector] };
    }

    cursor = cursor
      .find(_selector)
      .sort({ _id: sort * -1 })
      .limit(last);
  } else if (pageSize !== undefined && pageNumber !== undefined) {
    let _selector = normalize_data(selector);
    let offset = pageSize * pageNumber;
    cursor = cursor
      .find(_selector)
      .sort({ _id: sort })
      .skip(Math.max(offset, 0));

    if (pageSize >= 0) {
      cursor = cursor.limit(pageSize);
    }
  } else {
    cursor = cursor.find(normalize_data(selector)).sort({ _id: sort });
  }

  let data = await cursor.toArray();

  if (last !== undefined) {
    // This was reverse sorted for the limit, so flip it back
    data = data.reverse();
  }

  return data.map((doc) => normalize_result(doc));
};

MongoAdapter.getPaginationInfo = async (
  plugin_name,
  store_name,
  selector,
  options = {}
) => {
  check_options(options);
  const {
    first,
    after,
    last,
    before,
    pageSize: _pageSize,
    pageNumber,
    sort = 1
  } = options;

  let normalized_selector = normalize_data(selector);
  const cursor = () => get_collection(plugin_name, store_name).rawCollection();
  let totalCount = await cursor().find(normalized_selector).count();

  let result = {
    startCursor: null,
    startCursorOffset: 0,
    endCursor: null,
    endCursorOffset: first ?? totalCount - 1,
    totalCount
  };

  if (first !== undefined) {
    let page_selector = normalized_selector;
    let page_offset_selector = null;

    if (after !== undefined) {
      page_selector = { $and: [{ _id: { $gt: after } }, normalized_selector] };
      page_offset_selector = {
        $and: [{ _id: { $lt: after } }, normalized_selector]
      };
    }

    const page_count = Math.min(
      await cursor().find(page_selector).count(),
      first
    );

    let page = cursor().find(page_selector).sort({ _id: sort }).limit(first);
    const first_page_match = (await page.hasNext()) && (await page.next());

    page = cursor()
      .find(page_selector)
      .sort({ _id: sort })
      .skip(Math.max(page_count - 1, 0))
      .limit(1);
    const last_page_match = (await page.hasNext()) && (await page.next());

    result.startCursor = first_page_match?._id;
    result.endCursor = last_page_match?._id;

    if (page_offset_selector !== null) {
      result.startCursorOffset =
        (await cursor().find(page_offset_selector).count()) + 1;
      result.endCursorOffset = result.startCursorOffset + page_count - 1;
    } else {
      result.endCursorOffset = first - 1;
    }
  } else if (last !== undefined) {
    let page_selector = normalized_selector;
    let page_offset_selector = null;

    if (before !== undefined) {
      page_selector = { $and: [{ _id: { $lt: before } }, normalized_selector] };
      page_offset_selector = {
        $and: [{ _id: { $gte: before } }, normalized_selector]
      };
    }

    const page_count = Math.min(
      await cursor().find(page_selector).count(),
      last
    );

    let page = cursor()
      .find(page_selector)
      .sort({ _id: sort * -1 })
      .limit(last);
    const last_page_match = (await page.hasNext()) && (await page.next());

    page = cursor()
      .find(page_selector)
      .sort({ _id: sort * -1 })
      .limit(last)
      .skip(Math.max(page_count - 1, 0));
    const first_page_match = (await page.hasNext()) && (await page.next());

    result.startCursor = first_page_match?._id;
    result.endCursor = last_page_match?._id;

    if (page_offset_selector !== null) {
      result.endCursorOffset =
        totalCount - (await cursor().find(page_offset_selector).count()) - 1;
      result.startCursorOffset = result.endCursorOffset - last;
    } else {
      result.endCursorOffset = totalCount - 1;
      result.startCursorOffset = result.endCursorOffset - (last - 1);
    }
  } else if (_pageSize !== undefined && pageNumber !== undefined) {
    const pageSize = _pageSize === -1 ? totalCount : _pageSize;
    result.startCursorOffset = pageSize * pageNumber;
    const page_count = Math.min(
      (await cursor().find(normalized_selector).count()) -
        result.startCursorOffset,
      pageSize
    );
    result.endCursorOffset = result.startCursorOffset + page_count - 1;

    page = cursor()
      .find(normalized_selector)
      .sort({ _id: sort })
      .skip(Math.max(result.startCursorOffset, 0))
      .limit(1);
    result.startCursor = ((await page.hasNext()) && (await page.next()))?._id;

    page = cursor()
      .find(normalized_selector)
      .sort({ _id: sort })
      .skip(Math.max(result.endCursorOffset, 0))
      .limit(1);
    result.endCursor = ((await page.hasNext()) && (await page.next()))?._id;
  } else {
    let page = await cursor().find(normalized_selector).sort({ _id: sort });
    result.startCursor = ((await page.hasNext()) && (await page.next()))?._id;

    page = cursor()
      .find(normalized_selector)
      .sort({ _id: sort })
      .skip(Math.max(totalCount - 1, 0))
      .limit(1);
    result.endCursor = ((await page.hasNext()) && (await page.next()))?._id;
  }

  return result;
};

MongoAdapter.fetchOne = async (plugin_name, store_name, selector, options) => {
  return normalize_result(
    get_collection(plugin_name, store_name).findOne(normalize_data(selector))
  );
};

MongoAdapter.insert = async (plugin_name, store_name, data) => {
  // This will return an ObjectId, so cast it to a string
  return String(
    get_collection(plugin_name, store_name).insert(normalize_data(data))
  );
};

MongoAdapter.insertMany = async (plugin_name, store_name, data = []) => {
  // We don't use normalize_result on this because it returns an array of ObjectIds instead of an array of objects
  const results = await get_collection(plugin_name, store_name)
    .rawCollection()
    .insertMany(data.map((datum) => normalize_data(datum)));

  return (
    Object.values(results.insertedIds)?.map((object_id) => ({
      id: String(object_id)
    })) ?? []
  );
};

MongoAdapter.update = async (plugin_name, store_name, selector, data) => {
  return normalize_result(
    get_collection(plugin_name, store_name).update(
      normalize_data(selector),
      data
    )
  );
};

MongoAdapter.delete = async (plugin_name, store_name, selector) => {
  return get_collection(plugin_name, store_name).remove(
    normalize_data(selector)
  );
};

// -----------------------------------------------------------------------

export default MongoAdapter;
