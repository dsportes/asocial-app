<template>
  <div :class="'q-pa-xs full-width ' + dkli">
    <div class="fs-md text-italic">{{$t('FIavgrt')}}</div>
    <q-btn no-caps flat :label="tit" icon-right="expand_more">
    <q-menu anchor="bottom left" self="top left" max-height="10rem" 
      max-width="20rem">
      <q-list class="bg-secondary text-white">
        <q-item clickable v-close-popup @click="val=null">
          <span class="fs-md">{{$t('FItavgr')}}</span>
        </q-item>
        <q-separator/>
        <q-item v-for="na in la" :key="na.id" clickable 
          v-close-popup @click="val=na">
          <span class="fs-md">{{na.nom}}</span>
        </q-item>
        <q-separator/>
        <q-item v-for="ng in lg" :key="ng.id" clickable 
          v-close-popup @click="val=ng">
          <span class="fs-md">{{ng.nomc}}</span>
        </q-item>
      </q-list>
    </q-menu>
    </q-btn>
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import { getNg } from '../app/modele.mjs'
import { ID } from '../app/api.mjs'

export default ({
  name: 'FiltreAvgr',

  props: { nom: String, idx: Number },

  components: { },

  data () {
    return {
    }
  },

  watch: {
    val (ap) {
      this.fSt.setFiltre(this.nom, 'avgr', ap ? ap.id : 0)
    }
  },

  computed: {
    dkli () { return this.$q.dark.isActive ? (this.idx ? 'sombre' + (this.idx % 2) : 'sombre0') : (this.idx ? 'clair' + (this.idx % 2) : 'clair0') },
    tit () {
      if (!this.val) return this.$t('FItavgr')
      return ID.estGroupe(this.val.id) ? this.$t('groupe', [this.val.nomc]) : this.$t('avatar', [this.val.nom])
    }
  },

  setup (props) {
    const fSt = stores.filtre
    const aSt = stores.avatar
    const gSt = stores.groupe
    const val = ref(null)
    const nom = toRef(props, 'nom')
    const x = fSt.filtre[nom.value]
    val.value = x ? getNg(x) : null

    const la = ref(aSt.naAvatars)
    const lg = ref(gSt.ngGroupes)

    function setm () {
      la.value = aSt.naAvatars
      lg.value = gSt.ngGroupes
    }

    return {
      fSt,
      val,
      la,
      lg
    }
  }
})
</script>

<style lang="css">
.q-item { padding: 2px 5px !important; min-height: 0 !important; }
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
