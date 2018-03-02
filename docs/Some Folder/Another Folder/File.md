# Adding a New Service to IIS

## Add a new Application Pool
* Right click `Application Pools` -> `Add Application Pool`
* Give the application pool a name related to your service, for example: `Ldm.CoreLogic.Service`
* Click `OK`
* Rigt click the newly created app pool -> `Advanced Settings...`
* Under `Process Model`, select `Identity`
* Select `Custom account:` -> `Set...`
* Enter your account domain credentials:
    * INFOTRACK{REGION}\username, for example: INFOTRACKUS\ed.mcnealy
    * Enter your password

## Add DeliverySystems Site
If you don't have the `DeliverySystems` site added already, you will need to add that first.
* Right click `Sites` -> `Add Website...`
* Enter a site name - `DeliverySystems`
* For the physical path, create a new folder - `C:\Websites\DeliverySystems`
* Enter a port - `9000`

## Add Your Service as a New Application
* Under `Sites`, right click `DeliverySystems` -> `Add Application...`
* For alias, enter the same service name you gave your application pool, for example: `Ldm.CoreLogic.Service`
* Select your service's application pool
* For the physical path, enter the location to your service's root directory. This should contain:
    * `bin` folder
    * `[YourService].svc`
    * `Global.asax`

You can now browse to your new service. If you used the example variables given here, you can reach the service at: http://localhost:9000/Ldm.CoreLogic.Service/CoreLogicService.svc