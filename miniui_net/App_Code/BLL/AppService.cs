using System;
using System.Collections.Generic;
using System.Web;
using Plusoft.DAL;
using Plusoft.Factory;
using System.Collections;
using System.Data.Common;
using Plusoft.DBUtility;
using System.Transactions;

namespace Plusoft.BLL
{
    public class AppService: BaseService
    {
        EmployeeDAL employeeDal = DALFactory.GetEmployeeDAL();
        DeptDAL deptDal = DALFactory.GetDeptDAL();
        EduDAL eduDal = DALFactory.GetEduDAL();
        PositionDAL positionDal = DALFactory.GetPositionDAL();
        FileDAL fileDal = DALFactory.GetFileDAL();

        public AppService()
        {
            AddTransaction(employeeDal);
            AddTransaction(deptDal);
            AddTransaction(eduDal);
            AddTransaction(positionDal);
            AddTransaction(fileDal);

            //ProductDAL dal = new ProductDAL();
            //dal.FindAll("where ...", 1, 1);
        }

	    //////////////////////////////////////////////////////////////////////////////////////
        public ArrayList SearchEmployees(String key, int pageIndex, int pageSize, ArrayList sortFields)  {
		    return employeeDal.Search(key, pageIndex, pageSize, sortFields);
	    }
	
	    public Hashtable SearchEmployeesResult(String key, int pageIndex, int pageSize, ArrayList sortFields)  {
	        ArrayList data = SearchEmployees(key, pageIndex, pageSize, sortFields);
	        int total = SearchEmployeesTotal(key);
	    
	        Hashtable result = new Hashtable();
	        result["data"] =data;
	        result["total"] =total;
	        return result;
	    }
	
	    public ArrayList SearchEmployees(String key, int pageIndex, int pageSize, String sortField, String sortOrder)  {
		    return employeeDal.Search(key, pageIndex, pageSize, sortField, sortOrder);		
	    }
	
	    public int SearchEmployeesTotal(String key)  {
		    if(key == null) key = "";
		    return employeeDal.GetCount("name like '%"+key+"%'");
	    }
	
	    public Hashtable SearchEmployeesResult(String key, int pageIndex, int pageSize, String sortField, String sortOrder)  {
	        ArrayList data = SearchEmployees(key, pageIndex, pageSize, sortField, sortOrder);
	        int total = SearchEmployeesTotal(key);
	    
	        Hashtable result = new Hashtable();
	        result["data"] =data;
	        result["total"] =total;
            
            //汇总信息：年龄（minAge, maxAge, avgAge）
            Hashtable ageInfo = new DataBase().SelectFirst("select min(age) as minAge, max(age) as maxAge, avg(age) as avgAge from t_employee", null);            
            result["minAge"] = ageInfo["minAge"];
            result["maxAge"] = ageInfo["maxAge"];
            result["avgAge"] = ageInfo["avgAge"];

	        return result;
	    }

        

        public void SaveEmployees(ArrayList data)
        {
            DbTransaction trans = StartTransaction();
            try
            {
                for (int i = 0, l = data.Count; i < l; i++)
                {
                    Hashtable o = (Hashtable)data[i];

                    String id = o["id"] != null ? o["id"].ToString() : "";
                    //根据记录状态，进行不同的增加、删除、修改操作
                    String state = o["_state"] != null ? o["_state"].ToString() : "";

                    if (state == "added" || id == "")           //新增：id为空，或_state为added
                    {
                        o["createtime"] = DateTime.Now;
                        employeeDal.Insert(o);
                    }
                    else if (state == "removed" || state == "deleted")
                    {
                        employeeDal.Delete(id);
                    }
                    else if (state == "modified" || state == "") //更新：_state为空或modified
                    {
                        employeeDal.Update(o);
                    }

                    //if (i == 2) throw new Exception("aaa");

                }

                trans.Commit();
            }
            catch (Exception e)
            {
                trans.Rollback();
                throw e;
            }
            finally
            {
                CloseTransaction();
            }
        }

        //public void SaveEmployees(ArrayList data)
        //{
        //    using (TransactionScope ts = new TransactionScope())
        //    {
        //        for (int i = 0, l = data.Count; i < l; i++)
        //        {
        //            Hashtable o = (Hashtable)data[i];

        //            String id = o["id"] != null ? o["id"].ToString() : "";
        //            //根据记录状态，进行不同的增加、删除、修改操作
        //            String state = o["_state"] != null ? o["_state"].ToString() : "";

        //            if (state == "added" || id == "")           //新增：id为空，或_state为added
        //            {
        //                o["createtime"] = DateTime.Now;
        //                employeeDal.Insert(o);
        //            }
        //            else if (state == "removed" || state == "deleted")
        //            {
        //                employeeDal.Delete(id);
        //            }
        //            else if (state == "modified" || state == "") //更新：_state为空或modified
        //            {
        //                employeeDal.Update(o);
        //            }

        //            if (i == 1) throw new Exception("aaa");

        //        }

        //        ts.Complete();
        //    }

        //}

        public void RemoveEmployees(String id) 
	    {
            DbTransaction trans = StartTransaction();
            try
            {
			    if (String.IsNullOrEmpty(id)) return;
		        String[] ids = id.Split(',');
		        for (int i = 0, l = ids.Length; i < l; i++)
		        {
		            String s = ids[i];
		            employeeDal.Delete(s);
		        }

                trans.Commit();
		    }catch(Exception e) {
                trans.Rollback();
                throw e;
		    }finally{				
			    CloseTransaction();
		    }
		
	    }
	
	    public Hashtable GetEmployee(String id)  {
		    return employeeDal.FindById(id);
	    }
	
	    public ArrayList GetEmployeesByDeptId(String deptId, int pageIndex, int pageSize)  {
		    return employeeDal.FindAllByDetpId(deptId, pageIndex, pageSize);
	    }
	
	    public int GetEmployeesByDeptIdTotal(String deptId)  {
		    return employeeDal.GetCount("dept_id ='"+deptId+"'");
	    }
	
	    public Hashtable GetEmployeesByDeptIdResult(String deptId, int pageIndex, int pageSize)  {
	        ArrayList data = GetEmployeesByDeptId(deptId, pageIndex, pageSize);
	        int total = GetEmployeesByDeptIdTotal(deptId);
	        
	        Hashtable result = new Hashtable();
	        result["data"] =data;
	        result["total"] =total;
	        return result;
	    }

        public ArrayList GetDepartments()
        {
		    return deptDal.FindAll();		
	    }
	
	    public ArrayList GetPositions()  {
		    return positionDal.FindAll();		
	    }
	
	    public ArrayList GetPositionsByDeptId(String deptId)  {
		    return positionDal.FindAllByDeptId(deptId);
	    }
	
	    public ArrayList GetEducationals()  {
		    return eduDal.FindAll();		
	    }
	
	    public String AddFile(Hashtable o)  {
            return (String)fileDal.Insert(o);
	    }
	    
	    public void RemoveFile(String id)  {
		     fileDal.Delete(id);
	    }
	
	    public void UpdateFile(Hashtable o)  {
		     fileDal.Update(o);
	    }

    }
}