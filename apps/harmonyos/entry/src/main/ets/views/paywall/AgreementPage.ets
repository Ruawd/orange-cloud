import { HdsNavDestination } from '@kit.UIDesignKit';
// 协议阅读页：从付费墙的《会员服务说明》《自动续费服务协议》链接推入，正文见 AgreementTexts。
import { AgreementParam } from '../../models/Routes';
import { systemMaterial, OC_TITLE_BAR_INSET } from '../common/Effects';
import { OCLayout } from '../common/Daybreak';
import { OCSkyBackground } from '../common/OCSky';
import { AgreementDoc, AgreementKind, AgreementSection, agreementDoc } from './AgreementTexts';

@ComponentV2
export struct AgreementPage {
  @Local doc: AgreementDoc = agreementDoc(AgreementKind.MEMBERSHIP);

  build() {
    HdsNavDestination() {
      Stack({ alignContent: Alignment.TopStart }) {
        OCSkyBackground()
        Scroll() {
          Column({ space: 16 }) {
            Text(this.doc.updated)
              .fontSize(12)
              .fontColor($r('sys.color.font_tertiary'))
              .width('100%')

            Column({ space: 16 }) {
              ForEach(this.doc.sections, (section: AgreementSection) => {
                Column({ space: 6 }) {
                  Text(section.heading)
                    .fontSize(15)
                    .fontWeight(FontWeight.Medium)
                    .fontColor($r('sys.color.font_primary'))
                  Text(section.body)
                    .fontSize(14)
                    .lineHeight(22)
                    .fontColor($r('sys.color.font_secondary'))
                }
                .alignItems(HorizontalAlign.Start)
                .width('100%')
              }, (section: AgreementSection) => section.heading)
            }
            .width('100%')
            .padding(16)
            .backgroundColor($r('sys.color.comp_background_list_card'))
            .borderRadius(OCLayout.islandRadius)
          }
          .width('100%')
          .padding({
            left: OCLayout.pagePadding,
            right: OCLayout.pagePadding,
            top: 8,
            bottom: 32,
          })
        }
        .align(Alignment.Top)
        .scrollBar(BarState.Off)
        .width('100%')
        .height('100%')
      }
      .padding({ top: OC_TITLE_BAR_INSET })
      .width('100%')
      .height('100%')
    }
    .titleBar({ style: { systemMaterialEffect: systemMaterial() }, content: { title: { mainTitle: this.doc.title } } })
    .backgroundColor($r('sys.color.background_secondary'))
    .onReady((context: NavDestinationContext) => {
      const param = context.pathInfo.param as AgreementParam | undefined;
      this.doc = agreementDoc(param?.kind ?? AgreementKind.MEMBERSHIP);
    })
  }
}
