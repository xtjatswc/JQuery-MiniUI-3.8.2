using System;
using System.Collections.Generic;
using System.Web;

using System.Collections;
using System.Reflection;
using Plusoft.Utils;
using Plusoft.BLL;

namespace Plusoft.Web
{
    public class AjaxService : BaseService
    {
        public AjaxService(HttpRequest Request, HttpResponse Response)
            : base(Request, Response)
        {
        }
        
        //public Hashtable SearchEmployees(String key, int pageIndex, int pageSize, String sortField, String sortOrder)
        //{
        //    Hashtable result = new AppService().SearchEmployeesResult(key, pageIndex, pageSize, sortField, sortOrder);
        //    return result;
        //}

        public void SearchEmployees()
        {
            //查询条件
            string key = GetString("key");
            //分页
            int pageIndex = GetInt("pageIndex");
            int pageSize = GetInt("pageSize");
            //字段排序
            String sortField = GetString("sortField");
            String sortOrder = GetString("sortOrder");

            //业务层：数据库操作
            Hashtable result = new AppService().SearchEmployeesResult(key, pageIndex, pageSize, sortField, sortOrder);

            RenderJson(result);
        }

        public void SaveEmployees()
        {
            ArrayList data = GetArrayList("data");
            new AppService().SaveEmployees(data);
        }
        public void RemoveEmployees()
        {
            String id = GetString("id");
            new AppService().RemoveEmployees(id);            
        }
        public void GetEmployee()
        {
            String id = GetString("id");
            Hashtable user = new AppService().GetEmployee(id);
            RenderJson(user);
        }
        public void GetDepartments()
        {
            ArrayList data = new AppService().GetDepartments();
            RenderJson(data);
        }
        public void GetPositions()
        {
            ArrayList data = new AppService().GetPositions();
            RenderJson(data);
        }
        public void GetEducationals()
        {
            ArrayList data = new AppService().GetEducationals();
            RenderJson(data);
        }
        public void GetPositionsByDepartmenId()
        {
            String id = GetString("id");
            ArrayList data = new AppService().GetPositionsByDeptId(id);
            RenderJson(data);
        }

        public void GetDepartmentEmployees()
        {
            String dept_id = GetString("dept_id");
            int pageIndex = GetInt("pageIndex");
            int pageSize = GetInt("pageSize");

            Hashtable result = new AppService().GetEmployeesByDeptIdResult(dept_id, pageIndex, pageSize);
            RenderJson(result);
        }

        //public void SaveDepartment()
        //{
        //    String departmentsStr = GetString("departments");
        //    ArrayList departments = (ArrayList)JSON.Decode(departmentsStr);

        //    foreach (Hashtable d in departments)
        //    {
        //        new AppService().UpdateDepartment(d);
        //    }
        //}

        //////////////////////////////////////
        public void FilterCountrys()
        {
            String key = GetString("key");
            String value = GetString("value");

            //建立value的快速哈希索引，便于快速判断是否已经选择
            String[] values = value.Split(',');
            Hashtable valueMap = new Hashtable();
            for (int i = 0, l = values.Length; i < l; i++)
            {
                String id = values[i];
                valueMap[id] = true;
            }

            String path = Request.MapPath(@"countrys.txt");
            String s = Test.File.Read(path);
            ArrayList data = (ArrayList)JSON.Decode(s);

            //1）去除已经选择的记录
            for (int i = data.Count - 1; i >= 0; i--)
            {
                Hashtable o = (Hashtable)data[i];
                String id = Convert.ToString(o["id"]);
                if (valueMap[id] != null)
                {
                    data.RemoveAt(i);
                }
            }

            //2）根据名称查找
            ArrayList result = new ArrayList();
            for (int i = 0, l = data.Count; i < l; i++)
            {
                Hashtable o = (Hashtable)data[i];
                String text = Convert.ToString(o["text"]);
                if (String.IsNullOrEmpty(key) || text.ToLower().IndexOf(key.ToLower()) != -1)
                {
                    result.Add(o);
                }
            }

            //返回JSON数据
            String json = JSON.Encode(result);
            Response.Write(json);
        }
        public void FilterCountrys2()
        {
            String key = GetString("key");
            String path = Request.MapPath(@"countrys.txt");
            String s = Test.File.Read(path);
            ArrayList data = (ArrayList)JSON.Decode(s);

            //根据名称查找
            ArrayList result = new ArrayList();
            for (int i = 0, l = data.Count; i < l; i++)
            {
                Hashtable o = (Hashtable)data[i];
                String text = Convert.ToString(o["text"]);
                if (String.IsNullOrEmpty(key) || text.ToLower().IndexOf(key.ToLower()) != -1)
                {
                    result.Add(o);
                }
            }

            //返回JSON数据
            String json = JSON.Encode(result);
            Response.Write(json);

        }

        ////////////////////////////////////////////////////////////////
        //多级排序
        public void SearchEmployeesByMultiSort()
        {
            string key = GetString("key");
            int pageIndex = GetInt("pageIndex");
            int pageSize = GetInt("pageSize");
            ArrayList sortFields = GetArrayList("sortFields");
            
            Hashtable result = new AppService().SearchEmployeesResult(key, pageIndex, pageSize, sortFields);

            RenderJson(result);
        }

        public void SearchEmployeesByJsonP()
        {
            string key = GetString("key");
            int pageIndex = GetInt("pageIndex");
            int pageSize = GetInt("pageSize");
            String sortField = GetString("sortField");
            String sortOrder = GetString("sortOrder");

            Hashtable result = new AppService().SearchEmployeesResult(key, pageIndex, pageSize, sortField, sortOrder);
            //JSON
            String json = JSON.Encode(result);

            //跨域：后台要读取约定好的jsonp的callback名称
            string jsoncallback = GetString("jsoncallback");

            //返回数据的时候，用jsoncallback作为方法名
            RenderText(jsoncallback + '(' + json + ')');
        }

    }
}