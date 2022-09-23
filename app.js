const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("working");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const statusAndPriorityProperties = (request) => {
  return request.priority !== undefined && request.status !== undefined;
};
const priorityProperties = (request) => {
  return request.priority !== undefined;
};
const statusProperties = (request) => {
  return request.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case statusAndPriorityProperties(request.query):
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%'
            AND priority='${priority}'
            AND status='${status}';`;
      break;
    case priorityProperties(request.query):
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case statusProperties(request.query):
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%';`;
  }
  data = await database.all(getTodoQuery);
  response.send(data);
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
        SELECT
            *
        FROM
            todo
        WHERE
            id=${todoId};`;
  const dbResponse = await database.get(getTodo);
  response.send(dbResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodo = `
        INSERT INTO
            todo(id,todo,priority,status)
        VALUES
            (${id},'${todo}','${priority}','${status}')`;
  await database.run(postTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodo = `
    SELECT
        *
    FROM
        todo
    WHERE
        id=${todoId};`;
  const previousTodoResponse = await database.get(previousTodo);
  const {
    todo = previousTodoResponse.todo,
    priority = previousTodoResponse.priority,
    status = previousTodoResponse.status,
  } = request.body;

  const updateTodo = `
    UPDATE todo
    SET
        todo='${todo}',
        priority='${priority}',
        status='${status}'
    WHERE
        id=${todoId};`;
  await database.run(updateTodo);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
        DELETE FROM
            todo
        WHERE
            id=${todoId};`;
  await database.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
