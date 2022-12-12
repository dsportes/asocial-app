<template>
  <q-card :class="'row items-start ' + dkli(idx)">
    <div class="col-auto column items-center q-mr-sm">
      <img class="photomax" :src="avatar.na.photoDef" />
    </div>
    <div class="col column">
      <div>
        <info-txt :class="avatar.primaire ? 'bord2p' :''" :label="avatar.na.nomc" :info="'ID: ' + avatar.na.id"/>
        <span v-if="avatar.primaire" class="q-ml-sm prim">{{$t('MLAcptn')}}</span>
      </div>
      <show-html v-if="avatar.na.info" class="q-my-xs bord" :idx="idx" zoom maxh="4rem" :texte="avatar.na.info"/>
      <div v-else class="text-italic">{{$t('FAnocv')}}</div>
    </div>
  </q-card>
</template>
<script>

// import { toRef } from 'vue'
import ShowHtml from './ShowHtml.vue'
import InfoTxt from './InfoTxt.vue'

export default {
  name: 'FicheAvatar',

  props: { avatar: Object, idx: Number },

  components: { ShowHtml, InfoTxt },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') }
  },

  setup (props) {
    // const av = toRef(props, 'avatar')
    // console.log(av.value.na.nom)
    return {
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bord2p
  border-radius: 3px
  border: 2px solid $warning
  font-weight: bold
  padding: 1px 3px
.ptim
  font-variant: small-caps
</style>
