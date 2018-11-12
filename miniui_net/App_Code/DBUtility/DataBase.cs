using System;
using System.Collections.Generic;
using System.Web;
using System.Data.Common;
using System.Collections;
using System.Data;
using MySql.Data.MySqlClient;
using System.Data.OleDb;
using System.Data.SqlClient;
using System.Text.RegularExpressions;

namespace Plusoft.DBUtility
{
    public class DataBase
    {

        //MySql
        static String dbType = "MySql";
        public static String connectionString = "server=localhost; user id=root; password=root; database=plusoft_test;";
        
        //SqlServer
        //static String dbType = "SqlServer";
        //public static String connectionString = "server=localhost; database=plusoft_test; Integrated Security=True; ";

        //Oracle
        //static String dbType = "Oracle";
        //public static String connectionString = "Provider=OraOLEDB.Oracle.1;Data Source=XE;User Id=plus;Password=sa";

        public static DbConnection GetConnection()
        {
            DbConnection conn = null;

            if (dbType == "MySql")
            {
                conn = new MySqlConnection(connectionString);
            }
            else if (dbType == "Oracle")
            {
                conn = new OleDbConnection(connectionString);
            }
            else if (dbType == "SqlServer")
            {
                conn = new SqlConnection(connectionString);
            }

            conn.Open();

            return conn;
        }

        /////////////////////////////////////////////////////////////////////////

	    private DbConnection conn;
        public DbTransaction trans;
        private DbCommand command;        

        protected void Open(String sql)
        {
            Open(sql, null);
	    }
	
	    protected void Open(String sql, Hashtable param) {		
		    if(conn == null) {
                if (trans == null)
                {
                    conn = GetConnection();
                }
                else
                {
                    conn = trans.Connection;
                }
		    }
            command = CreateCommand(sql, param);
            command.Connection = conn;
            if (trans != null) command.Transaction = trans;
	    }
	
	    protected void Close() {
            if (trans == null )
            {
			    conn.Close();
                conn = null;
		    }            
	    }

        protected Object getFirstValue(Hashtable o) {		    
            foreach (DictionaryEntry de in o)
            {
                return de.Value;
            }
		    return null;	
	    }

	    //返回第一行第一列
	    public Object SelectScalar(String sql) 
        {		
		    return SelectScalar(sql, null);
        }
	
	    public Object SelectScalar(String sql, Hashtable param) 
        {		
		    Hashtable o = SelectFirst(sql, param);
		
		    return getFirstValue(o);
        }

        //返回第一行
        public Hashtable SelectFirst(String sql)
        {
            return SelectFirst(sql, null);
        }

        public Hashtable SelectFirst(String sql, Hashtable param)
        {
            ArrayList list = Select(sql, param);
            return list.Count == 0 ? null : (Hashtable)list[0];
        }

        //返回所有行
        public ArrayList Select(String sql) 
	    {
		    return Select(sql, null);
	    }
		
	    public ArrayList Select(String sql, Hashtable param)
	    {
		    Open(sql, param);
		    
            DbDataReader reader = command.ExecuteReader();
            DataTable table = new DataTable();
            table.Load(reader);
            ArrayList list = DataTable2ArrayList(table);
            reader.Close();

		    Close();
		    return list;
	    }

        public ArrayList Select(String sql, Hashtable param, int pageIndex, int pageSize)
        {
            bool flag = false;
            if (pageIndex != -1)
            {
                if (dbType == "MySql")
                {
                    sql += "\nlimit " + pageIndex * pageSize + "," + pageSize;
                    flag = true;
                }
                if (dbType == "SqlServer")
                {
                    //string s = sql;
                    //s = s.Insert(s.IndexOf("select") + 6, " ROW_NUMBER() OVER ( ORDER BY id ) AS rownumber ,");
                    //s = "SELECT TOP " + pageSize + " * FROM ( " + s + " ) __ WHERE   rownumber > " + (pageIndex + 1) * pageSize;

                    //flag = true;
                }
            }

            //数据库分页（最佳性能）
            if(flag) return Select(sql, param);

            //内存分页（临时方案）
            ArrayList dataAll = Select(sql, param);
            if (pageIndex == -1) return dataAll;

            ArrayList data = new ArrayList();
            int start = pageIndex * pageSize, end = start + pageSize;
            int total = dataAll.Count;

            for (int i = start, l = end; i < l; i++)
            {
                if (i >= total) break;

                Hashtable record = (Hashtable)dataAll[i];
                data.Add(record);
            }
            return data;
        }

        public int Execute(String sql)
        {
            return Execute(sql, null);
	    }

        public int Execute(String sql, Hashtable param)
        {
		    Open(sql, param);

            int count = command.ExecuteNonQuery();
		    
		    Close();

            return count;
	    }

        /////////////////////////////////////////////////////////////////////////////////////

        protected DbCommand CreateCommand(string sql, Hashtable param)
        {
            DbCommand command = null;
            if (dbType == "MySql")
            {
                command = new MySqlCommand();
            }
            else if (dbType == "Oracle")
            {
                command = new OleDbCommand();
            }
            else if (dbType == "SqlServer")
            {
                command = new SqlCommand();
            }
            ApplySqlParameters(sql, param, command);
            return command;
        }

        private void ApplySqlParameters(string sql, Hashtable param, IDbCommand cmd)
        {
            if (dbType == "MySql")
            {
                if (param != null)
                {
                    MatchCollection ms = Regex.Matches(sql, @"@\w+");
                    foreach (Match m in ms)
                    {
                        string key = m.Value;
                        string newKey = "?" + key.Substring(1);
                        sql = sql.Replace(key, newKey);

                        Object value = param[key];
                        if (value == null)
                        {
                            value = param[key.Substring(1)];
                        }

                        cmd.Parameters.Add(new MySqlParameter(newKey, value));
                    }
                }
                cmd.CommandText = sql;
            }
            else if (dbType == "Oracle")
            {
                if (param != null)
                {
                    MatchCollection ms = Regex.Matches(sql, @"@\w+");
                    int i = 1;
                    foreach (Match m in ms)
                    {
                        string key = m.Value;
                        string newKey = "@P" + i++;
                        sql = sql.Replace(key, "?");

                        Object value = param[key];
                        if (value == null)
                        {
                            value = param[key.Substring(1)];
                        }

                        cmd.Parameters.Add(new OleDbParameter(newKey, value));
                    }
                }
                cmd.CommandText = sql;
            }
            else if (dbType == "SqlServer")
            {
                if (param != null)
                {
                    MatchCollection ms = Regex.Matches(sql, @"@\w+");
                    int i = 1;
                    foreach (Match m in ms)
                    {
                        string key = m.Value;

                        Object value = param[key];
                        if (value == null)
                        {
                            value = param[key.Substring(1)];
                        }
                        if (value == null) value = DBNull.Value;

                        cmd.Parameters.Add(new SqlParameter(key, value));
                    }
                }
                cmd.CommandText = sql;
            }
        }

        private ArrayList DataTable2ArrayList(DataTable data)
        {
            ArrayList array = new ArrayList();
            for (int i = 0; i < data.Rows.Count; i++)
            {
                DataRow row = data.Rows[i];

                Hashtable record = new Hashtable();
                for (int j = 0; j < data.Columns.Count; j++)
                {
                    object cellValue = row[j];
                    if (cellValue.GetType() == typeof(DBNull))
                    {
                        cellValue = null;
                    }
                    record[data.Columns[j].ColumnName] = cellValue;
                }
                array.Add(record);
            }
            return array;
        }

        //////////////////////////////////////////////////////////////////////////////////

        public static String CreateOrderSql(ArrayList sortFields, String namePrefix)
        {
            if (namePrefix == null) namePrefix = "";

            String sql = "";
            if (sortFields != null && sortFields.Count > 0)
            {
                for (int i = 0; i < sortFields.Count; i++)
                {
                    Hashtable record = (Hashtable)sortFields[i];
                    String sortField = (String)record["field"];
                    String sortOrder = (String)record["dir"];

                    if (String.IsNullOrEmpty(sortOrder)) sortOrder = "asc";

                    if (i == 0)
                    {
                        sql += " order by " + namePrefix + sortField + " " + sortOrder;
                    }
                    else
                    {
                        sql += ", " + namePrefix + sortField + " " + sortOrder;
                    }
                }
            }
            return sql;
        }

        public static ArrayList GetTableColumns(String tableName)
        {
            String sql = "select * from information_schema.COLUMNS where table_name = '" + tableName + "'";
            //DbConnection conn = DBAccess.GetConnection();	
            //ResultSet rs = conn.createStatement().executeQuery(sql);

            //ArrayList list = DBAccess.resultSetToList(rs);

            ArrayList list = new DataBase().Select(sql);
            return list;
        }

        private static Hashtable insertSqlCache = new Hashtable();
        private static Hashtable updateSqlCache = new Hashtable();
       
        public static String CreateInsertSql(String tableName)
        {
            return CreateInsertSql(tableName, null);
        }

        protected static String CreateInsertSql(String tableName, Hashtable mapping)
        {
            String sql = Convert.ToString(insertSqlCache[tableName]);
                        
            if (String.IsNullOrEmpty(sql))
            {
                Hashtable dbMapping = new Hashtable();
                if (mapping != null)
                {
                    foreach (DictionaryEntry de in mapping)
                    {
                        dbMapping[de.Value.ToString()] = de.Key.ToString();
                    }
                }

                ArrayList columns = GetTableColumns(tableName);
                String s1 = "";
                String s2 = "";

                bool flag = true;
                for (int i = 0, l = columns.Count; i < l; i++)
                {
                    Hashtable column = (Hashtable)columns[i];
                    String name = column["COLUMN_NAME"].ToString();

                    //自增长字段不能主动插入数据
                    if (column["EXTRA"].ToString() == "auto_increment")
                    {
                        continue;
                    }

                    if (!flag)
                    {
                        s1 += ", ";
                        s2 += ", ";
                    }
                    s1 += name;

                    String modelName = Convert.ToString(dbMapping[name]);
                    if (String.IsNullOrEmpty(modelName)) modelName = name;

                    s2 += "@" + modelName;

                    flag = false;
                }
                sql = "insert into " + tableName + " (" + s1 + ") values (" + s2 + ")";
                
                insertSqlCache[tableName] = sql;
            }
            return sql;
        }

        public static String CreateUpdateSql(String tableName, String tableIdField)
        {
            return CreateUpdateSql(tableName, tableIdField, null);
        }

        protected static String CreateUpdateSql(String tableName, String tableIdField, Hashtable mapping)
        {
            String sql = Convert.ToString(updateSqlCache[tableName]);

            if (String.IsNullOrEmpty(sql))
            {
                Hashtable dbMapping = new Hashtable();
                if (mapping != null)
                {
                    foreach (DictionaryEntry de in mapping)
                    {
                        dbMapping[de.Value.ToString()] = de.Key.ToString();
                    }
                }


                ArrayList columns = GetTableColumns(tableName);
                String s = "";

                bool flag = true;
                for (int i = 0, l = columns.Count; i < l; i++)
                {
                    Hashtable column = (Hashtable)columns[i];
                    String name = column["COLUMN_NAME"].ToString();

                    if (name != tableIdField)
                    {
                        if (!flag)
                        {
                            s += ", ";
                        }

                        String modelName = Convert.ToString(dbMapping[name]);
                        if (String.IsNullOrEmpty(modelName)) modelName = name;
                        s += name + " = @" + modelName;

                        flag = false;
                    }
                }
                sql = "update " + tableName + " set " + s + " where " + tableIdField + "=@id";

                updateSqlCache[tableName] = sql;
            }
            return sql;
        }

    }

    
    
}