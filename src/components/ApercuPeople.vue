<template>
  <div :class="'row items-start ' + dkli(idx)">
    <div class="col-auto q-mr-sm">
      <img class="photomax" :src="p.photo" />
    </div>
    <div class="col">
      <div class="row justify-between">
        <div>
          <span class="text-bold fs-md q-mr-sm">{{p.na.nomc}}</span> 
          <span class="text-bold fs-sm font-mono q-mr-sm">#{{id}}</span> 
        </div>
        <q-btn v-if="!simple" dense size="sm" color="primary" icon="add"
          :label="$t('details')" @click="ouvrirdetails"/>
      </div>
      <show-html v-if="p.info" class="q-my-xs bord" :idx="idx" 
        zoom maxh="3rem" :texte="p.info"/>
      <div v-else class="text-italic">{{$t('FAnocv')}}</div>
      <div v-if="p.sp" :class="'fs-md ' + (p.sp === 2 ? 'text-bold' : '')">{{$t('APtr' + p.sp)}}</div>
      <div v-if="!simple && p.avch.length" class="row items-center">
        <span class="text-italic">{{$t('APch', p.avch.length)}}</span>
        <span v-for="n in p.avch" :key="n" class="q-ml-sm q-px-xs bord">{{n}}</span>
      </div>
      <div v-if="!simple && p.gr.length" class="row items-center">
        <span class="text-italic">{{$t('APgr', p.gr.length)}}</span>
        <span v-for="n in p.gr" :key="n" class="q-ml-sm q-px-xs bord">{{n}}</span>
      </div>
    </div>

  </div>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import { IDCOMPTABLE } from '../app/api.mjs'
import { getNg } from '../app/modele.mjs'

export default {
  name: 'ApercuPeople',

  props: { id: Number, idx: Number, simple: Boolean },

  components: { ShowHtml },

  computed: { },

  data () { return {
    detailspeople: false
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ouvrirdetails () {
      this.ui.peopleId = this.id
      this.ui.detailspeople = true
    }
  },

  setup (props) {
    const pStore = stores.people
    const ui = stores.ui
    const config = stores.config
    const id = toRef(props, 'id')
    
    function getPh() { return id.value === IDCOMPTABLE ? config.iconSuperman : config.iconAvatar }  
    const phDef = ref(getPh())

    function getP () {
      const p = pStore.getPeople(id.value)
      p.info = p.cv ? (p.cv.info || '') : ''
      p.photo = p.cv ? (p.cv.photo || phDef.value) : phDef.value
      p.avch = []
      p.chats.forEach(id => { p.avch.push(getNg(id).nom) })
      p.avch.sort((a,b) => { a < b ? -1 : (a > b ? 1 : 0)})
      p.gr = []
      for(const idg of p.groupes.keys()) { p.gr.push(getNg(idg).nom) }
      p.gr.sort((a,b) => { a < b ? -1 : (a > b ? 1 : 0)})
      return p
    }

    const p = ref(getP())

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => id.value, (ap, av) => {
        p.value = getP()
        phDef.value = getPh()
      }
    )

    pStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'getElt' && args[0].id === id.value) {
          p.value = getP()
        }
      })
    })

    return {
      p,
      ui
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
