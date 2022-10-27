// This is for importing a document passed via url
exports = async function (namespace, importdoctypename, importurl, listviewfields) {

    namespace = "animals.monkeys";
    importdoctypename = "Monkeys";
    importurl = "https://www.montemagno.com/monkeys.json";
    listviewfields = "Name,Location,Description";
    
    /*Get an Authorization object - should be standard in any non private function*/
    // const authorization = await context.functions.execute("newAuthorization", context.user.id);
    // if (authorization == null) { return { ok: false, message: "User not Authorized" }; }

    const filetoimport = await fetchFile(importurl);
    let rval = { ok: false, message: "No Error Message Set" };
  
    try {
        const [db, collection] = namespace.split('.');

        const importdb = context.services.get("mongodb-atlas").db(db);
        const importcoll = importdb.collection(collection);
        
        /*
        App Services doesn't support drop on an existing collection if you want to replace everything, not add to it.
        This aggregation pipeline is a workaround for this that allows you to essentially generate nothing and use $out to add nothing to the collection.
        $out is a stage that can overwrite the contents. But it has to be done on a collection and can't take passed in data.
        If the collection doesn't exist, the pipeline simply won't do anything. So this is a way of emptying a collection if it exists, otherwise doing nothing
        so it is ready to then have our fetched data written to it.
        */
        const emptyCollPipeline = [{$indexStats: {}}, {$match: {luce:"awesome"}}, {$out: collection}];
        await importcoll.aggregate(emptyCollPipeline).toArray();
        importcoll.insertMany(filetoimport);
        rval = { ok: true, message: "Succesfully imported to collection" };
    }
    catch (e) {
        console.log(`Error inserting imported file: ${e}`);

        return { ok: false, message: `Error inserting imported file: ${e}` }
    }
}

async function fetchFile(fileUrl) {
    try {
        const response = await context.http.get({
            url: fileUrl
        });

        return JSON.parse(response.body.text());

    } catch (e) {
        console.log(`Error: ${e}`);
    }
}