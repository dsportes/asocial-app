<template>
  <q-card :class="'row items-start ' + dkli(idx)">
    <div class="col-auto column items-center q-mr-sm">
      <img class="photomax" :src="avatar.na.photoDef" />
    </div>
    <div class="col">
      <div>
        <span class="text-bold fs-md q-mr-sm">{{na.nomc}}</span> 
        <span class="text-bold fs-sm font-mono q-mr-sm">#{{na.id}}</span> 
      </div>
      <show-html v-if="info" class="q-my-xs bord" :idx="idx" 
        zoom maxh="4rem" :texte="info"/>
      <div v-else class="text-italic">{{$t('FAnocv')}}</div>
      <q-btn class="q-my-xs" flat size="sm" :label="$t('CVedit')" icon="edit" dense color="primary" @click="editerCV"/>
    </div>

    <q-dialog v-model="edition">
      <carte-visite :photo-init="na.photo" :info-init="na.info" :na="na"
        :close="closeCV" @ok="cvchangee"/>
    </q-dialog>

  </q-card>
</template>
<script>

import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import CarteVisite from '../components/CarteVisite.vue'

export default {
  name: 'FicheAvatar',

  props: { na: Object, idx: Number, edit: Boolean },

  components: { ShowHtml, CarteVisite },

  computed: {
    info () { return this.na.info }
  },

  data () {
    return {
      edition: false
    }
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    editerCV () { this.edition = true },
    closeCV () { this.edition = false },
    async cvchangee (res) {
      if (res && this.na) {
        const cv = new Cv().init(this.av.id, res.ph, res.info)
        await new MajCv().run(cv)
      }
    }

},

  setup (props) {
    const avStore = stores.avatar
    const av = toRef(props, 'na')
    const avatar = avStore.getAvatar(av.value.id)
    // console.log(av.value.na.nom)
    return {
      avatar
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
