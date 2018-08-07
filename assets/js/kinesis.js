// Configure Credentials to use Cognito
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:c6c09fed-8087-4448-977b-74569b3847ec'
});

AWS.config.region = 'us-east-1';
// We're going to partition kinesis records based on an identity.
// We need to get credentials first, then attach our event listeners.
AWS.config.credentials.get(function(err) {
    // attach event listener
    if (err) {
        alert('Error retrieving credentials.');
        console.error(err);
        return;
    }
    // create kinesis client once
    var kinesis = new AWS.Kinesis({
        apiVersion: '2013-12-02'
    });

    var blogContent = document.getElementById('BlogContent');

    // Get Scrollable height
    var scrollableHeight = blogContent.clientHeight;

    var recordData = [];
    var TID = null;
    blogContent.addEventListener('scroll', function(event) {
        clearTimeout(TID);
        // Prevent creating a record while a user is actively scrolling
        TID = setTimeout(function() {
            // calculate percentage
            console.log(event)
            var scrollableElement = event.target;
            var scrollHeight = scrollableElement.scrollHeight;
            var scrollTop = scrollableElement.scrollTop;

            var scrollTopPercentage = Math.round((scrollTop / scrollHeight) * 100);
            var scrollBottomPercentage = Math.round(((scrollTop + scrollableHeight) / scrollHeight) * 100);
            console.log("Creating record with %0.2f", scrollTopPercentage)
            // Create the kinesis record
            var record = {
                Data: JSON.stringify({
                    blog: window.location.href,
                    scrollTopPercentage: scrollTopPercentage,
                    scrollBottomPercentage: scrollBottomPercentage,
                    time: new Date()
                }),
                PartitionKey: 'partition-' + AWS.config.credentials.identityId
            };
            recordData.push(record);
        }, 100);
    });

    // upload data to kinesis every second if data exists
    setInterval(function() {
        if (!recordData.length) {
            return;
        }
        console.log("Pushing data to kinesis")
        // upload data to kinesis
        kinesis.putRecords({
            Records: recordData,
            StreamName: 'blog_stats'
        }, function(err, data) {
            if (err) {
                console.error(err);
            }
        });
        // clear record data
        recordData = [];
    }, 1000);
});