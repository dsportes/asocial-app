<template>
<div :class="'row justify-between ' + dkli(idx)">
  <q-btn v-if="edit" class="btn" dense color="primary" icon="edit" size="xs" @click="editer">
    <q-tooltip class="bg-white text-primary">{{$t('editer')}}</q-tooltip>
  </q-btn>
  <div class="col font-mono fs-md curso">{{ed1}}</div>
  <q-btn v-if="edit" class="col-auto" size="sm" icon="edit" color="primary" @click="editer"/>

  <q-dialog v-model="mcedit" persistent>
    <choix-motscles :motscles="motscles" :src="src" :close="closemc" :groupe-id="groupeId"
      :titre="$t('AMCchoix')" @ok="okmc"/>
  </q-dialog>
</div>
</template>
<script>
export default ({
  name: 'ApercuMotscles',

  props: { ducompte: Boolean, dugroupe: Boolean, src: Object, edit: Boolean, ok: Function },

  computed: {
    edl () { return this.motscles.edit(this.src, false, this.groupeId) }
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async editer () {
      if (await this.session.aut(3, true)) this.mcedit = true
    },
    closemc () { this.mcedit = false },
    okmc (mc) { if (this.ok) this.ok(mc)}
  },

  setup (props) {
    
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn
  position: absolute
  right: 0
  top: 0
</style>
