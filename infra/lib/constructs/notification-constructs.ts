import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as sns from "aws-cdk-lib/aws-sns"
import * as sns_subs from "aws-cdk-lib/aws-sns-subscriptions"

export class NotificationConstruct extends Construct{
    public readonly hrTopic: sns.Topic;

    constructor(scope: Construct, id: string){
        super(scope, id)

        this.hrTopic = new sns.Topic(this, "HrNotifications", {
            topicName: 'hr-new-application'
        })

        this.hrTopic.addSubscription(
            new sns_subs.EmailSubscription("support@advikprep.com")
        )
    }
}